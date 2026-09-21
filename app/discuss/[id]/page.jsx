"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AeroBubbles from "../../components/AeroBubbles";
import { apiGet, apiPost } from "../../lib/api";
import { useRequireSession } from "../../lib/session";
import { SUPABASE_MISSING_MESSAGE } from "../../lib/supabaseClient";

// How often an idle room asks the engine what the other person has done.
// Polled rather than subscribed: the transcript lives behind the API, not in a
// table the browser is allowed to read directly.
const POLL_MS = 6000;

/** Merge server rows into what is on screen, keyed by id, oldest first. */
function mergeMessages(current, incoming) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) =>
    (a.created_at || "").localeCompare(b.created_at || "")
  );
}

export default function DiscussionRoomPage() {
  const params = useParams();
  const conversationId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { userId, isAuthenticating, isSupabaseConfigured } = useRequireSession();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [note, setNote] = useState("");
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  // Refs, not state: the deliberation loop reads these between awaits, where a
  // re-rendered closure would still be holding the values it started with.
  const conversationRef = useRef(null);
  const runningRef = useRef(false);
  const stopRef = useRef(false);
  const transcriptEndRef = useRef(null);

  const applyConversation = useCallback((next) => {
    conversationRef.current = next;
    setConversation(next);
  }, []);

  const refresh = useCallback(
    async ({ quiet = false, signal } = {}) => {
      if (!conversationId) return;
      try {
        const data = await apiGet(
          `/api/social/conversations/${conversationId}`,
          { signal }
        );
        applyConversation(data.conversation);
        setMessages((current) => mergeMessages(current, data.messages ?? []));
        if (!quiet) setError("");
      } catch (loadError) {
        if (loadError?.name === "AbortError") return;
        if (!quiet) setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, applyConversation]
  );

  useEffect(() => {
    if (isAuthenticating || !isSupabaseConfigured || !conversationId) return undefined;

    // The first read is awaited inside the effect and abandoned if you leave
    // the room before it lands; the poll after it keeps the transcript in step
    // with whatever the other person is doing.
    const controller = new AbortController();
    async function loadRoom() {
      await refresh({ signal: controller.signal });
    }
    loadRoom();

    const timer = window.setInterval(() => {
      // Never poll over a round in flight: the round is already writing the
      // state this would be reading.
      if (!runningRef.current && !document.hidden) refresh({ quiet: true });
    }, POLL_MS);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [isAuthenticating, isSupabaseConfigured, conversationId, refresh]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isRunning]);

  /**
   * Run twin rounds.
   *
   * `continuous` is the answer to a rejected proposal: the twins keep going,
   * round after round, until they run out of credits, somebody agrees, or the
   * Stop button is pressed. Each round is its own request so every one of them
   * lands on screen as it happens instead of after the money is gone.
   */
  const runDeliberation = useCallback(
    async (continuous = false) => {
      if (runningRef.current || !conversationId) return;

      runningRef.current = true;
      stopRef.current = false;
      setIsRunning(true);
      setError("");
      setNotice("");

      try {
        for (;;) {
          const current = conversationRef.current;
          const data = await apiPost(
            `/api/social/conversations/${conversationId}/deliberate`,
            { expected_round: current?.round ?? 0 }
          );

          applyConversation(data.conversation);
          setMessages((existing) => mergeMessages(existing, data.messages ?? []));

          if (data.rounds_run === 0 || !data.can_continue) {
            if (data.stop_reason) setNotice(data.conversation.stop_detail || "");
            break;
          }
          if (!continuous || stopRef.current) break;
        }
      } catch (runError) {
        if (runError.status === 409) {
          // The other person's browser got there first, or you both agreed.
          await refresh({ quiet: true });
          setNotice(runError.message);
        } else {
          setError(runError.message);
        }
      } finally {
        runningRef.current = false;
        setIsRunning(false);
      }
    },
    [conversationId, applyConversation, refresh]
  );

  const handleSend = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setError("");
    try {
      const data = await apiPost(
        `/api/social/conversations/${conversationId}/messages`,
        { content }
      );
      applyConversation(data.conversation);
      setMessages((current) => mergeMessages(current, [data.message]));
      setDraft("");
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleMode = async (mode) => {
    if (!conversation || conversation.mode === mode) return;
    // Optimistic: the toggle is a preference both of you see, not a gate — the
    // buttons underneath it work in either mode.
    applyConversation({ ...conversation, mode });
    try {
      const data = await apiPost(
        `/api/social/conversations/${conversationId}/mode`,
        { mode }
      );
      applyConversation(data.conversation);
    } catch (modeError) {
      setError(modeError.message);
      refresh({ quiet: true });
    }
  };

  const handleVerdict = async (verdict) => {
    if (isVoting || isRunning) return;

    setIsVoting(true);
    setError("");
    setNotice("");
    try {
      const data = await apiPost(
        `/api/social/conversations/${conversationId}/verdict`,
        { verdict, note: verdict === "disagree" ? note.trim() : "" }
      );
      applyConversation(data.conversation);
      setMessages((current) => mergeMessages(current, data.messages ?? []));
      setNote("");
      setIsNoteOpen(false);

      if (data.outcome === "resolved") {
        setNotice("You both agreed. The twins have stopped.");
      } else if (data.outcome === "continue") {
        if (data.conversation.can_deliberate) {
          // The point of disagreeing: the twins go again, and keep going.
          runDeliberation(true);
        } else {
          setNotice(
            data.conversation.stop_detail ||
              "There are no credits left for another round."
          );
        }
      } else {
        setNotice("Recorded. Waiting on the other side to vote.");
      }
    } catch (voteError) {
      setError(voteError.message);
    } finally {
      setIsVoting(false);
    }
  };

  const handleStop = () => {
    stopRef.current = true;
    setNotice("Stopping after this round.");
  };

  if (isAuthenticating) {
    return (
      <div className="relative flex h-full items-center justify-center">
        <AeroBubbles />
        <p className="relative z-10 animate-pulse text-sm font-semibold text-aero-sky-800">
          Synchronizing neural session…
        </p>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="relative flex h-full items-center justify-center p-6">
        <AeroBubbles />
        <div className="aero-panel relative z-10 max-w-md p-8 text-center">
          <span className="mb-3 block text-4xl" aria-hidden="true">
            🔌
          </span>
          <h1 className="text-lg font-bold text-aero-sky-800">Not connected</h1>
          <p className="mt-2 text-sm text-aero-ink-soft">{SUPABASE_MISSING_MESSAGE}</p>
        </div>
      </div>
    );
  }

  const isResolved = conversation?.status === "resolved";
  const canDeliberate = Boolean(conversation?.can_deliberate) && !isResolved;
  const hasProposal = Boolean(conversation?.proposal);
  const awaitingMyVerdict = hasProposal && conversation?.my_verdict === "pending" && !isResolved;
  const twinMode = conversation?.mode === "auto";

  let lastRound = 0;

  return (
    <div className="relative flex h-full flex-col items-center p-4 md:p-6">
      <AeroBubbles />

      <div className="aero-panel relative z-10 flex h-full max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col">
        {/* --- header ---------------------------------------------------- */}
        <header className="flex-none border-b border-white/70 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/discuss"
              className="aero-btn aero-btn--glass px-3 py-2 text-xs"
              title="Back to discussions"
            >
              <span aria-hidden="true">←</span>
              <span className="sr-only">Back to discussions</span>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-extrabold text-aero-sky-800">
                {conversation?.topic || (isLoading ? "Opening the room…" : "Discussion")}
              </h1>
              <p className="text-[11px] font-semibold text-aero-ink-soft">
                with {conversation?.partner?.display_name || "a friend"}
                {conversation?.round > 0 && ` · round ${conversation.round}`}
              </p>
            </div>
            <span className="aero-chip px-3 py-1.5 text-[11px] font-bold">
              <span aria-hidden="true">⚡</span>
              {conversation ? `${conversation.my_credits} credits` : "—"}
            </span>
          </div>

          {conversation && (
            <p className="mt-2 text-[11px] text-aero-ink-soft">
              A round is one turn each and costs you both a credit.{" "}
              {conversation.partner?.display_name || "They"} have{" "}
              {conversation.partner_credits}.
            </p>
          )}
        </header>

        {/* --- transcript ------------------------------------------------ */}
        <div className="aero-scroll flex-1 space-y-3 overflow-y-auto p-6">
          {isLoading && (
            <p className="animate-pulse text-center text-xs font-semibold text-aero-ink-soft">
              Reading the transcript…
            </p>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="rounded-2xl border border-white/80 bg-white/60 p-5 text-center text-sm text-aero-ink-soft">
              Nothing said yet. Type something, or send your twin in to open with a
              plan.
            </div>
          )}

          {messages.map((message) => {
            const isMine = message.user_id === userId;
            const isTwin = message.author === "twin";
            const isSystem = message.author === "system";
            const startsRound = isTwin && message.round > lastRound;
            if (startsRound) lastRound = message.round;

            if (isSystem) {
              return (
                <p
                  key={message.id}
                  className="mx-auto max-w-md rounded-full border border-white/80 bg-white/70 px-4 py-2 text-center text-[11px] font-semibold text-aero-ink-soft"
                >
                  {message.content}
                </p>
              );
            }

            return (
              <div key={message.id}>
                {startsRound && (
                  <div className="my-4 flex items-center gap-3">
                    <span className="h-px flex-1 bg-white/80" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-aero-sky-600">
                      Round {message.round}
                    </span>
                    <span className="h-px flex-1 bg-white/80" />
                  </div>
                )}

                <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%]">
                    <p
                      className={`mb-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                        isMine ? "text-right" : "text-left"
                      } ${isTwin ? "text-aero-grass-700" : "text-aero-sky-600"}`}
                    >
                      {isTwin ? "🧬 " : ""}
                      {isMine ? "You" : message.speaker}
                      {isTwin ? "’s twin" : ""}
                    </p>
                    <div
                      className={`whitespace-pre-wrap rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                        isTwin
                          ? `border bg-white/90 text-aero-ink ${
                              isMine
                                ? "rounded-br-md border-aero-grass-300"
                                : "rounded-bl-md border-aero-sky-300"
                            }`
                          : isMine
                            ? "rounded-br-md border border-aero-sky-600 bg-gradient-to-b from-aero-sky-400 to-aero-sky-600 text-white"
                            : "rounded-bl-md border border-white/85 bg-white/85 text-aero-ink"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {isRunning && (
            <div className="flex justify-center">
              <div className="animate-pulse rounded-full border border-white/85 bg-white/70 px-5 py-2 text-xs font-semibold text-aero-ink-soft">
                The twins are talking…
              </div>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* --- the proposal on the table --------------------------------- */}
        {hasProposal && (
          <div
            className={`flex-none border-t px-6 py-4 ${
              isResolved
                ? "border-aero-grass-200 bg-aero-grass-50/80"
                : "border-white/70 bg-aero-sky-50/70"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-aero-sky-600">
              {isResolved ? "Agreed plan" : "On the table"}
            </p>
            <p className="mt-1 text-sm font-semibold text-aero-ink">
              {conversation.proposal}
            </p>

            {isResolved ? (
              <p className="mt-2 text-xs font-semibold text-aero-grass-700">
                ✓ You both agreed. The twins have stopped.
              </p>
            ) : awaitingMyVerdict ? (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleVerdict("agree")}
                    disabled={isVoting || isRunning}
                    className="aero-btn aero-btn--grass px-5 py-2 text-xs"
                  >
                    <span>👍 I agree</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNoteOpen((open) => !open)}
                    disabled={isVoting || isRunning}
                    className="aero-btn aero-btn--glass px-5 py-2 text-xs"
                  >
                    <span>👎 I disagree</span>
                  </button>
                  <span className="self-center text-[11px] text-aero-ink-soft">
                    {conversation.partner_verdict === "agree"
                      ? `${conversation.partner?.display_name} has agreed.`
                      : "Disagreeing sends the twins back round."}
                  </span>
                </div>

                {isNoteOpen && (
                  <div className="mt-3 rounded-2xl border border-white/80 bg-white/70 p-3">
                    <label
                      htmlFor="objection"
                      className="text-[11px] font-bold uppercase tracking-[0.14em] text-aero-sky-600"
                    >
                      What is wrong with it?
                    </label>
                    <textarea
                      id="objection"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Your twin argues this point for you in the next round."
                      maxLength={1000}
                      className="aero-field mt-1 h-20 w-full resize-none rounded-2xl px-4 py-2.5 text-sm"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleVerdict("disagree")}
                        disabled={isVoting || isRunning}
                        className="aero-btn px-5 py-2 text-xs"
                      >
                        <span>
                          {canDeliberate
                            ? "Send them back round"
                            : "Record my objection"}
                        </span>
                      </button>
                      <span className="text-[11px] text-aero-ink-soft">
                        {canDeliberate
                          ? "They will keep talking until you agree or the credits run out."
                          : "There are no credits left for another round."}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-2 text-xs font-semibold text-aero-ink-soft">
                You said you {conversation.my_verdict}.{" "}
                {conversation.partner_verdict === "pending"
                  ? `Waiting on ${conversation.partner?.display_name || "the other side"}.`
                  : `They said they ${conversation.partner_verdict}.`}
              </p>
            )}
          </div>
        )}

        {/* --- notices --------------------------------------------------- */}
        {(error || notice) && (
          <div
            className={`flex-none border-t px-6 py-3 text-xs font-semibold ${
              error
                ? "border-red-200 bg-red-50/90 text-red-700"
                : "border-white/70 bg-white/70 text-aero-ink-soft"
            }`}
          >
            {error || notice}
          </div>
        )}

        {/* --- composer -------------------------------------------------- */}
        <div className="flex-none border-t border-white/70 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {[
              { value: "manual", label: "💬 Type it myself" },
              { value: "auto", label: "🧬 Send my twin" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleMode(option.value)}
                aria-pressed={conversation?.mode === option.value}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  conversation?.mode === option.value
                    ? "aero-btn"
                    : "border border-white/80 bg-white/70 text-aero-sky-800 hover:bg-white/95"
                }`}
              >
                <span>{option.label}</span>
              </button>
            ))}

            {isRunning && (
              <button
                type="button"
                onClick={handleStop}
                className="aero-btn aero-btn--glass ml-auto px-4 py-2 text-xs"
              >
                <span>⏹ Stop</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-3">
            <label htmlFor="draft" className="sr-only">
              Message
            </label>
            <input
              id="draft"
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                twinMode
                  ? "Brief your twin, or just send it in…"
                  : "Type a message…"
              }
              disabled={isSending}
              className="aero-field flex-1 px-5 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={isSending || !draft.trim()}
              className="aero-btn aero-btn--glass px-6 py-3 text-sm"
            >
              <span>Send</span>
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => runDeliberation(false)}
              disabled={!canDeliberate || isRunning || isVoting}
              className="aero-btn aero-btn--grass px-6 py-2.5 text-xs"
            >
              <span>
                {isRunning
                  ? "Twins talking…"
                  : conversation?.round > 0
                    ? "🧬 One more round"
                    : "🧬 Send the twins in"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => runDeliberation(true)}
              disabled={!canDeliberate || isRunning || isVoting}
              className="aero-btn aero-btn--glass px-5 py-2.5 text-xs"
            >
              <span>Let them settle it</span>
            </button>
            <span className="text-[11px] text-aero-ink-soft">
              {isResolved
                ? "Settled."
                : canDeliberate
                  ? "Each round costs you one credit and your friend one credit."
                  : conversation?.stop_detail || "No credits left for a round."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
