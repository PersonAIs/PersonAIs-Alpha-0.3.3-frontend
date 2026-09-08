"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AeroBubbles from "../components/AeroBubbles";
import { TERMS_VERSION } from "../lib/legal";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const AVATAR_STORAGE_KEY = "alpha_avatar_image";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  // Nothing to verify when Supabase was never configured, so start settled.
  const [isAuthenticating, setIsAuthenticating] = useState(isSupabaseConfigured);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;

    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        const user = data?.session?.user;
        if (!user) {
          router.replace("/auth");
          return;
        }
        setEmail(user.email ?? "");
        setIsAuthenticating(false);
      })
      .catch(() => {
        if (!cancelled) router.replace("/auth");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  // The old handler only changed the URL, so the Supabase session survived and
  // the gateway bounced you straight back into the app. Actually end it.
  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await supabase?.auth.signOut();
    } finally {
      router.replace("/auth");
    }
  };

  const handleClearTwin = () => {
    try {
      window.localStorage.removeItem(AVATAR_STORAGE_KEY);
    } catch {
      /* nothing stored, nothing to clear */
    }
    router.push("/setup");
  };

  if (isAuthenticating) {
    return (
      <div className="relative flex h-full items-center justify-center">
        <AeroBubbles />
        <p className="relative z-10 animate-pulse text-sm font-semibold text-aero-sky-800">
          Loading your settings…
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-full p-6 md:p-10">
      <AeroBubbles />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="aero-wordmark text-3xl font-extrabold tracking-tight">
            System Settings
          </h1>
          <Link href="/" className="aero-btn aero-btn--glass px-5 py-2.5 text-sm">
            <span>← Back to Matrix</span>
          </Link>
        </div>

        <div className="aero-panel mb-6 p-8">
          <h2 className="text-lg font-bold text-aero-sky-800">Account</h2>
          <p className="mt-1 text-sm text-aero-ink-soft">
            Manage your digital twin connection and subscription tier.
          </p>

          <dl className="mt-6 grid gap-3 rounded-2xl border border-white/80 bg-white/55 p-4 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-aero-sky-600">
                Signed in as
              </dt>
              <dd className="mt-1 truncate text-sm font-semibold text-aero-ink">
                {email || "Unknown"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-aero-sky-600">
                Build
              </dt>
              <dd className="mt-1 text-sm font-semibold text-aero-ink">Alpha 0.4.0</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-4">
            <Link
              href="/pricing"
              className="group flex items-center justify-between rounded-2xl border border-white/80 bg-gradient-to-r from-aero-sky-50 to-aero-grass-50 p-4 transition-colors hover:border-aero-sky-400"
            >
              <span className="text-left">
                <span className="block font-bold text-aero-sky-800">
                  Subscription &amp; Billing
                </span>
                <span className="mt-1 block text-xs text-aero-ink-soft">
                  Upgrade your tier or view pre-orders.
                </span>
              </span>
              <span aria-hidden="true" className="text-xl font-bold text-aero-sky-600">
                →
              </span>
            </Link>

            <button
              type="button"
              onClick={handleClearTwin}
              className="group flex items-center justify-between rounded-2xl border border-white/80 bg-white/60 p-4 text-left transition-colors hover:border-aero-grass-400"
            >
              <span>
                <span className="block font-bold text-aero-grass-700">
                  Rebuild Digital Twin
                </span>
                <span className="mt-1 block text-xs text-aero-ink-soft">
                  Clear the stored reference photo and start setup again.
                </span>
              </span>
              <span aria-hidden="true" className="text-xl font-bold text-aero-grass-600">
                ↻
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isSigningOut}
              className="group flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/80 p-4 text-left transition-colors hover:bg-red-100/80 disabled:opacity-60"
            >
              <span>
                <span className="block font-bold text-red-600">
                  {isSigningOut ? "Signing out…" : "Log Out"}
                </span>
                <span className="mt-1 block text-xs text-red-400">
                  End your session and return to the gateway.
                </span>
              </span>
              <span aria-hidden="true" className="text-xl font-bold text-red-500">
                ↪
              </span>
            </button>
          </div>
        </div>

        <div className="aero-panel p-6">
          <h2 className="text-sm font-bold text-aero-sky-800">Legal</h2>
          <p className="mt-2 text-xs leading-relaxed text-aero-ink-soft">
            You accepted the temporary alpha terms ({TERMS_VERSION}) when you
            registered. Email verification is switched off for this release, so
            there is no password-reset email — and alpha data can be wiped
            without notice.
          </p>
          <Link
            href="/legal"
            className="mt-3 inline-block text-xs font-bold text-aero-sky-700 underline underline-offset-2 hover:text-aero-sky-900"
          >
            Read the Alpha Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
