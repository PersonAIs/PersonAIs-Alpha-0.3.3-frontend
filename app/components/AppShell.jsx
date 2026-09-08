"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// The gateway and the terms are shown to signed-out visitors, so they render
// full-bleed without the app sidebar. Previously the sidebar (with its Settings
// link) sat over the login form even when nobody was signed in.
const CHROMELESS_ROUTES = ["/auth", "/legal"];

const NAV_ITEMS = [
  { href: "/", label: "Chat", icon: "💬" },
  { href: "/pricing", label: "Plans", icon: "✨" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const isChromeless = CHROMELESS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isChromeless) {
    return <main className="min-h-screen">{children}</main>;
  }

  const closeFeedback = () => {
    setIsFeedbackOpen(false);
    setFeedbackSent(false);
    setRating(0);
    setFeedbackText("");
  };

  return (
    <div className="flex h-screen">
      <aside className="z-30 flex w-24 flex-none flex-col items-center justify-between border-r border-white/70 bg-white/45 py-6 shadow-[4px_0_24px_-18px_rgba(9,62,92,0.8)] backdrop-blur-xl">
        <Link href="/" className="flex flex-col items-center gap-1" title="PersonAIs">
          <span className="aero-wordmark text-3xl font-extrabold tracking-tight">P</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-aero-sky-700">
            PersonAIs
          </span>
        </Link>

        <nav className="flex flex-col gap-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all ${
                  isActive
                    ? "aero-btn"
                    : "border border-white/80 bg-white/70 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset] hover:bg-white/95"
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setIsFeedbackOpen(true)}
          className="aero-btn aero-btn--grass h-12 w-12 text-xl"
          title="Send feedback"
        >
          <span aria-hidden="true">📣</span>
          <span className="sr-only">Send feedback</span>
        </button>
      </aside>

      <main className="aero-scroll relative h-screen flex-1 overflow-y-auto">
        {children}
      </main>

      {isFeedbackOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-aero-sky-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
          onClick={closeFeedback}
        >
          <div
            className="aero-panel w-full max-w-md p-8"
            onClick={(event) => event.stopPropagation()}
          >
            {feedbackSent ? (
              <div className="py-6 text-center">
                <span className="mb-3 block text-5xl" aria-hidden="true">
                  🫧
                </span>
                <h3 className="text-lg font-bold text-aero-sky-800">Thanks for the report</h3>
                <p className="mt-1 text-xs text-aero-ink-soft">
                  Alpha feedback goes straight to the build notes.
                </p>
                <button
                  type="button"
                  onClick={closeFeedback}
                  className="aero-btn aero-btn--glass mt-6 px-6 py-2.5 text-xs"
                >
                  <span>Close</span>
                </button>
              </div>
            ) : (
              <>
                <h3
                  id="feedback-title"
                  className="aero-wordmark text-center text-xl font-extrabold"
                >
                  Alpha Experience
                </h3>
                <p className="mb-6 text-center text-xs text-aero-ink-soft">
                  Rate your digital twin connection
                </p>

                <div className="mb-6 flex justify-center gap-2 text-2xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`${star} out of 5`}
                      aria-pressed={star <= rating}
                      className={`transition-transform hover:scale-110 ${
                        star <= rating ? "opacity-100" : "opacity-30 grayscale"
                      }`}
                    >
                      <span aria-hidden="true">⭐</span>
                    </button>
                  ))}
                </div>

                <textarea
                  value={feedbackText}
                  onChange={(event) => setFeedbackText(event.target.value)}
                  placeholder="Describe any bugs, latency, or suggestions…"
                  className="aero-field mb-6 h-28 resize-none rounded-2xl px-4 py-3 text-sm"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeFeedback}
                    className="aero-btn aero-btn--glass flex-1 py-2.5 text-xs"
                  >
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackSent(true)}
                    disabled={!rating && !feedbackText.trim()}
                    className="aero-btn aero-btn--grass flex-1 py-2.5 text-xs"
                  >
                    <span>Submit Log</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
