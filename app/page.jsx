"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AeroBubbles from "./components/AeroBubbles";
import {
  isSupabaseConfigured,
  supabase,
  SUPABASE_MISSING_MESSAGE,
} from "./lib/supabaseClient";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://personais-api.net";

const AVATAR_STORAGE_KEY = "alpha_avatar_image";

export default function ChatPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "Neural link established. How can I assist you today?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Nothing to verify when Supabase was never configured, so start settled.
  const [isAuthenticating, setIsAuthenticating] = useState(isSupabaseConfigured);
  const chatEndRef = useRef(null);

  // Auth gatekeeper: unauthenticated visitors go back to the gateway.
  useEffect(() => {
    if (!supabase) return undefined;

    let cancelled = false;

    const applySession = (session) => {
      if (cancelled) return;
      if (!session?.user) {
        router.replace("/auth");
        return;
      }
      setUserId(session.user.id);
      setIsAuthenticating(false);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => applySession(data?.session))
      .catch(() => {
        if (!cancelled) router.replace("/auth");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => applySession(session));

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [router]);

  // The twin portrait saved during setup.
  useEffect(() => {
    try {
      setAvatar(window.localStorage.getItem(AVATAR_STORAGE_KEY));
    } catch {
      setAvatar(null);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSignOut = useCallback(async () => {
    await supabase?.auth.signOut();
    router.replace("/auth");
  }, [router]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || "guest_tester",
          message: userMsg,
        }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Raw Server Response:", text);
        throw new Error(
          "Matrix offline: the backend returned HTML. Verify NEXT_PUBLIC_BACKEND_URL."
        );
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Server returned ${res.status}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: data.reply || data.response || "Neural signal confirmed.",
        },
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `Critical error: ${error.message}`, isError: true },
      ]);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="relative flex h-full flex-col items-center justify-center p-4 md:p-6">
      <AeroBubbles />

      <div className="aero-panel relative z-10 flex h-full max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col">
        <header className="flex flex-none items-center justify-between border-b border-white/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 flex-none overflow-hidden rounded-full border-2 border-white bg-aero-sky-100 shadow-[0_6px_14px_-8px_rgba(12,61,89,0.9)]">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt="Your digital twin"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center text-lg"
                  aria-hidden="true"
                >
                  🧬
                </span>
              )}
            </div>
            <div>
              <h1 className="aero-wordmark text-lg font-extrabold tracking-tight">
                PersonAIs Matrix
              </h1>
              <p className="text-[11px] font-semibold text-aero-ink-soft">
                Alpha 0.4.0 live instance
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="aero-btn aero-btn--glass px-4 py-2 text-xs"
          >
            <span>Sign Out</span>
          </button>
        </header>

        <div className="aero-scroll flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "rounded-br-md border border-aero-sky-600 bg-gradient-to-b from-aero-sky-400 to-aero-sky-600 text-white"
                    : msg.isError
                      ? "rounded-bl-md border border-red-200 bg-red-50/90 text-red-700"
                      : "rounded-bl-md border border-white/85 bg-white/85 text-aero-ink"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="animate-pulse rounded-2xl rounded-bl-md border border-white/85 bg-white/70 px-5 py-3 text-xs font-semibold text-aero-ink-soft">
                Accessing neural matrix…
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="flex flex-none gap-3 border-t border-white/70 p-4"
        >
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <input
            id="message"
            type="text"
            placeholder="Send a transmission…"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            disabled={isLoading}
            className="aero-field flex-1 px-5 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="aero-btn px-7 py-3 text-sm"
          >
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
