"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AeroBubbles from "../components/AeroBubbles";
import { apiGet } from "../lib/api";
import { useRequireSession } from "../lib/session";
import { SUPABASE_MISSING_MESSAGE } from "../lib/supabaseClient";

// Kept in step with the backend's conversation statuses.
export const STATUS_LABELS = {
  open: { label: "Open", className: "text-aero-sky-800" },
  deliberating: { label: "Waiting on your verdict", className: "text-aero-grass-700" },
  resolved: { label: "Agreed", className: "text-aero-grass-700" },
  exhausted: { label: "Out of credits", className: "text-red-600" },
};

export default function DiscussionsPage() {
  const { isAuthenticating, isSupabaseConfigured } = useRequireSession();
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async ({ signal } = {}) => {
    try {
      const data = await apiGet("/api/social/conversations", { signal });
      setConversations(data.conversations ?? []);
      setError("");
    } catch (loadError) {
      if (loadError?.name === "AbortError") return;
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticating || !isSupabaseConfigured) return undefined;

    const controller = new AbortController();
    async function loadConversations() {
      await refresh({ signal: controller.signal });
    }
    loadConversations();

    return () => controller.abort();
  }, [isAuthenticating, isSupabaseConfigured, refresh]);

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

  return (
    <div className="relative min-h-full p-6 md:p-10">
      <AeroBubbles />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="aero-wordmark text-3xl font-extrabold tracking-tight">
              Discussions
            </h1>
            <p className="mt-1 text-sm text-aero-ink-soft">
              Shared rooms where you and a friend — or your twins — work something out.
            </p>
          </div>
          <Link href="/friends" className="aero-btn px-5 py-2.5 text-sm">
            <span>+ New discussion</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading && (
          <p className="animate-pulse text-sm font-semibold text-aero-ink-soft">
            Opening your rooms…
          </p>
        )}

        {!isLoading && conversations.length === 0 && !error && (
          <div className="aero-panel p-8 text-center">
            <span className="mb-3 block text-4xl" aria-hidden="true">
              🫧
            </span>
            <h2 className="text-lg font-bold text-aero-sky-800">No discussions yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-aero-ink-soft">
              Add a friend, pick something you need to decide together, and either
              type it out or send your twins in to do the planning.
            </p>
            <Link href="/friends" className="aero-btn mt-6 inline-flex px-6 py-2.5 text-sm">
              <span>Go to your network</span>
            </Link>
          </div>
        )}

        <ul className="grid gap-3">
          {conversations.map((conversation) => {
            const status = STATUS_LABELS[conversation.status] || STATUS_LABELS.open;
            const needsYou =
              conversation.status === "deliberating" && conversation.my_verdict === "pending";
            return (
              <li key={conversation.id}>
                <Link
                  href={`/discuss/${conversation.id}`}
                  className="group block rounded-2xl border border-white/80 bg-white/65 p-5 transition-colors hover:border-aero-sky-400 hover:bg-white/85"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xl" aria-hidden="true">
                      {conversation.mode === "auto" ? "🧬" : "💬"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-aero-ink">
                        {conversation.topic}
                      </span>
                      <span className="text-xs text-aero-ink-soft">
                        with {conversation.partner?.display_name || "a friend"} ·{" "}
                        {conversation.round === 0
                          ? "no rounds yet"
                          : `round ${conversation.round}`}
                      </span>
                    </span>
                    <span className={`text-xs font-bold ${status.className}`}>
                      {needsYou ? "Needs your verdict" : status.label}
                    </span>
                    <span aria-hidden="true" className="text-lg font-bold text-aero-sky-600">
                      →
                    </span>
                  </div>

                  {conversation.proposal && (
                    <p className="mt-3 line-clamp-2 rounded-xl border border-white/80 bg-aero-sky-50/70 px-3 py-2 text-xs text-aero-ink-soft">
                      <span className="font-bold text-aero-sky-700">On the table: </span>
                      {conversation.proposal}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
