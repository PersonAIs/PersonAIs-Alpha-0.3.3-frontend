"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AeroBubbles from "../components/AeroBubbles";
import { apiGet, apiPost } from "../lib/api";
import { useRequireSession } from "../lib/session";
import { SUPABASE_MISSING_MESSAGE } from "../lib/supabaseClient";

export default function FriendsPage() {
  const router = useRouter();
  const { isAuthenticating, isSupabaseConfigured } = useRequireSession();

  const [network, setNetwork] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [codeInput, setCodeInput] = useState("");
  const [addState, setAddState] = useState({ busy: false, message: "", tone: "info" });

  const [displayName, setDisplayName] = useState("");
  const [twinBrief, setTwinBrief] = useState("");
  const [profileState, setProfileState] = useState({ busy: false, message: "" });
  const [copied, setCopied] = useState(false);

  const [startingFor, setStartingFor] = useState(null);
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("auto");
  const [startError, setStartError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const refresh = useCallback(async ({ signal } = {}) => {
    try {
      const data = await apiGet("/api/social/friends", { signal });
      setNetwork(data);
      // Only seed the editors the first time: overwriting them on every
      // refresh would wipe out whatever is half-typed.
      setDisplayName((current) => current || data.me?.display_name || "");
      setTwinBrief((current) => current || data.me?.twin_brief || "");
      setLoadError("");
    } catch (error) {
      if (error?.name === "AbortError") return;
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticating || !isSupabaseConfigured) return undefined;

    // The first load is awaited inside the effect and abandoned if the page
    // goes away mid-flight, so nothing sets state on a component that is no
    // longer mounted.
    const controller = new AbortController();
    async function loadNetwork() {
      await refresh({ signal: controller.signal });
    }
    loadNetwork();

    return () => controller.abort();
  }, [isAuthenticating, isSupabaseConfigured, refresh]);

  const handleAddFriend = async (event) => {
    event.preventDefault();
    const code = codeInput.trim();
    if (!code || addState.busy) return;

    setAddState({ busy: true, message: "", tone: "info" });
    try {
      const data = await apiPost("/api/social/friends/request", { friend_code: code });
      const name = data.friend?.display_name || "That twin";
      const messages = {
        pending: `Request sent to ${name}. They will see it next time they open PersonAIs.`,
        accepted: `${name} had already asked you — you are now connected.`,
        already_friends: `${name} is already in your network.`,
        already_requested: `You have already asked ${name}. Waiting on them.`,
      };
      setAddState({
        busy: false,
        message: messages[data.status] || `Request ${data.status}.`,
        tone: "ok",
      });
      setCodeInput("");
      refresh();
    } catch (error) {
      setAddState({ busy: false, message: error.message, tone: "error" });
    }
  };

  const handleRespond = async (requestId, action) => {
    try {
      await apiPost("/api/social/friends/respond", { request_id: requestId, action });
      refresh();
    } catch (error) {
      setLoadError(error.message);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (profileState.busy) return;

    setProfileState({ busy: true, message: "" });
    try {
      const data = await apiPost("/api/social/me", {
        display_name: displayName.trim(),
        twin_brief: twinBrief,
      });
      setNetwork((current) => (current ? { ...current, me: data.profile } : current));
      setProfileState({ busy: false, message: "Saved. Your twin has its brief." });
    } catch (error) {
      setProfileState({ busy: false, message: error.message });
    }
  };

  const handleCopyCode = async () => {
    const code = network?.me?.friend_code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the code is on screen to be read.
      setCopied(false);
    }
  };

  const handleStartDiscussion = async (event, friendId) => {
    event.preventDefault();
    if (isStarting) return;

    setIsStarting(true);
    setStartError("");
    try {
      const data = await apiPost("/api/social/conversations", {
        friend_id: friendId,
        topic,
        mode,
      });
      router.push(`/discuss/${data.conversation.id}`);
    } catch (error) {
      setStartError(error.message);
      setIsStarting(false);
    }
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

  const me = network?.me;
  // Engines before 0.4.5 send no usage, and then the hint just leaves it out.
  const dailyLimit = network?.usage?.daily_limit;
  const twinsHint =
    dailyLimit === 0
      ? "Paused for now"
      : dailyLimit > 0
        ? `1 credit each per round · up to ${dailyLimit} a day`
        : "1 credit each per round";
  const friends = network?.friends ?? [];
  const incoming = network?.incoming ?? [];
  const outgoing = network?.outgoing ?? [];

  return (
    <div className="relative min-h-full p-6 md:p-10">
      <AeroBubbles />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="aero-wordmark text-3xl font-extrabold tracking-tight">
            Twin Network
          </h1>
          <p className="mt-1 text-sm text-aero-ink-soft">
            Add a friend by their code, then let your twins do the planning.
          </p>
        </div>

        {loadError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {/* --- your card ------------------------------------------------ */}
        <section className="aero-panel mb-6 p-8">
          <h2 className="text-lg font-bold text-aero-sky-800">Your twin&apos;s calling card</h2>
          <p className="mt-1 text-sm text-aero-ink-soft">
            Share this code with somebody to let them connect. Your email address is
            never searchable.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-white/80 bg-white/60 p-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-aero-sky-600">
              Friend code
            </span>
            <code className="aero-wordmark text-2xl font-extrabold tracking-[0.2em]">
              {me?.friend_code || (isLoading ? "…" : "—")}
            </code>
            <button
              type="button"
              onClick={handleCopyCode}
              disabled={!me?.friend_code}
              className="aero-btn aero-btn--glass ml-auto px-4 py-2 text-xs"
            >
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-5 grid gap-4">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-aero-sky-600">
                Display name
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="What your friends should see"
                maxLength={60}
                className="aero-field mt-1 w-full px-4 py-2.5 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-aero-sky-600">
                Standing instructions to your twin
              </span>
              <textarea
                value={twinBrief}
                onChange={(event) => setTwinBrief(event.target.value)}
                placeholder="e.g. Never commit me to a weekend. Keep any budget under £400."
                maxLength={600}
                className="aero-field mt-1 h-24 w-full resize-none rounded-2xl px-4 py-3 text-sm"
              />
              <span className="mt-1 block text-xs text-aero-ink-soft">
                Your twin treats these as orders in every discussion, before anything
                the other side proposes.
              </span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={profileState.busy}
                className="aero-btn px-6 py-2.5 text-xs"
              >
                <span>{profileState.busy ? "Saving…" : "Save"}</span>
              </button>
              {profileState.message && (
                <span className="text-xs font-semibold text-aero-ink-soft">
                  {profileState.message}
                </span>
              )}
            </div>
          </form>
        </section>

        {/* --- add a friend --------------------------------------------- */}
        <section className="aero-panel mb-6 p-8">
          <h2 className="text-lg font-bold text-aero-sky-800">Add a friend</h2>
          <form onSubmit={handleAddFriend} className="mt-4 flex flex-wrap gap-3">
            <label htmlFor="friend-code" className="sr-only">
              Friend code
            </label>
            <input
              id="friend-code"
              type="text"
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
              placeholder="PA-XXXXXX"
              className="aero-field flex-1 px-5 py-3 text-sm tracking-[0.15em]"
            />
            <button
              type="submit"
              disabled={addState.busy || !codeInput.trim()}
              className="aero-btn aero-btn--grass px-6 py-3 text-sm"
            >
              <span>{addState.busy ? "Sending…" : "Send request"}</span>
            </button>
          </form>
          {addState.message && (
            <p
              className={`mt-3 text-xs font-semibold ${
                addState.tone === "error" ? "text-red-600" : "text-aero-grass-700"
              }`}
            >
              {addState.message}
            </p>
          )}
        </section>

        {/* --- requests -------------------------------------------------- */}
        {(incoming.length > 0 || outgoing.length > 0) && (
          <section className="aero-panel mb-6 p-8">
            <h2 className="text-lg font-bold text-aero-sky-800">Requests</h2>

            {incoming.length > 0 && (
              <ul className="mt-4 grid gap-3">
                {incoming.map((request) => (
                  <li
                    key={request.request_id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/80 bg-white/60 p-4"
                  >
                    <span className="text-xl" aria-hidden="true">
                      🧬
                    </span>
                    <span>
                      <span className="block font-bold text-aero-ink">
                        {request.display_name}
                      </span>
                      <span className="text-xs text-aero-ink-soft">
                        {request.friend_code} · wants to connect
                      </span>
                    </span>
                    <span className="ml-auto flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRespond(request.request_id, "accept")}
                        className="aero-btn aero-btn--grass px-4 py-2 text-xs"
                      >
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(request.request_id, "decline")}
                        className="aero-btn aero-btn--glass px-4 py-2 text-xs"
                      >
                        <span>Decline</span>
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {outgoing.length > 0 && (
              <p className="mt-4 text-xs text-aero-ink-soft">
                Waiting on:{" "}
                {outgoing.map((request) => request.display_name).join(", ")}.
              </p>
            )}
          </section>
        )}

        {/* --- friends --------------------------------------------------- */}
        <section className="aero-panel p-8">
          <h2 className="text-lg font-bold text-aero-sky-800">
            Connected twins {friends.length > 0 && `(${friends.length})`}
          </h2>

          {isLoading && (
            <p className="mt-4 animate-pulse text-sm text-aero-ink-soft">
              Reading your network…
            </p>
          )}

          {!isLoading && friends.length === 0 && (
            <p className="mt-4 text-sm text-aero-ink-soft">
              Nobody yet. Send somebody your friend code above and their twin will
              show up here.
            </p>
          )}

          <ul className="mt-4 grid gap-3">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="rounded-2xl border border-white/80 bg-white/60 p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xl" aria-hidden="true">
                    🧬
                  </span>
                  <span>
                    <span className="block font-bold text-aero-ink">
                      {friend.display_name}
                    </span>
                    <span className="text-xs text-aero-ink-soft">{friend.friend_code}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStartingFor(startingFor === friend.id ? null : friend.id);
                      setTopic("");
                      setStartError("");
                    }}
                    className="aero-btn ml-auto px-5 py-2 text-xs"
                  >
                    <span>
                      {startingFor === friend.id ? "Cancel" : "Start a discussion"}
                    </span>
                  </button>
                </div>

                {startingFor === friend.id && (
                  <form
                    onSubmit={(event) => handleStartDiscussion(event, friend.id)}
                    className="mt-4 grid gap-3 border-t border-white/70 pt-4"
                  >
                    <label className="block">
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-aero-sky-600">
                        What are you two deciding?
                      </span>
                      <input
                        type="text"
                        value={topic}
                        onChange={(event) => setTopic(event.target.value)}
                        placeholder="e.g. Where to hold the offsite, and when"
                        className="aero-field mt-1 w-full px-4 py-2.5 text-sm"
                      />
                    </label>

                    <fieldset className="flex flex-wrap gap-2">
                      <legend className="sr-only">How to talk</legend>
                      {[
                        { value: "manual", label: "💬 We type", hint: "Free" },
                        { value: "auto", label: "🧬 Our twins talk", hint: twinsHint },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setMode(option.value)}
                          aria-pressed={mode === option.value}
                          className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                            mode === option.value
                              ? "aero-btn"
                              : "border border-white/80 bg-white/70 text-aero-sky-800 hover:bg-white/95"
                          }`}
                        >
                          <span>
                            {option.label}
                            <span className="ml-2 font-semibold opacity-70">{option.hint}</span>
                          </span>
                        </button>
                      ))}
                    </fieldset>

                    {startError && (
                      <p className="text-xs font-semibold text-red-600">{startError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isStarting || topic.trim().length < 3}
                      className="aero-btn aero-btn--grass justify-self-start px-6 py-2.5 text-xs"
                    >
                      <span>{isStarting ? "Opening…" : "Open the room"}</span>
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
