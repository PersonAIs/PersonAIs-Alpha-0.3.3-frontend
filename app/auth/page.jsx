"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AeroBubbles from "../components/AeroBubbles";
import TermsDialog from "../components/TermsDialog";
import {
  describeAuthError,
  isValidEmail,
  MIN_PASSWORD_LENGTH,
} from "../lib/authErrors";
import { TERMS_HIGHLIGHTS, TERMS_VERSION } from "../lib/legal";
import {
  isSupabaseConfigured,
  supabase,
  SUPABASE_MISSING_MESSAGE,
} from "../lib/supabaseClient";

const AVATAR_STORAGE_KEY = "alpha_avatar_image";

/** Returning testers who already built a twin skip the setup step. */
function destinationAfterLogin() {
  try {
    return window.localStorage.getItem(AVATAR_STORAGE_KEY) ? "/" : "/setup";
  } catch {
    return "/setup";
  }
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Nothing to check when Supabase was never configured, so start settled.
  const [isCheckingSession, setIsCheckingSession] = useState(isSupabaseConfigured);

  const isLogin = mode === "login";

  // Someone who is already signed in should not sit on the gateway.
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data?.session) {
        router.replace(destinationAfterLogin());
      } else {
        setIsCheckingSession(false);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const switchMode = useCallback((nextMode) => {
    setMode(nextMode);
    setErrorMsg("");
    setPassword("");
    setConfirmPassword("");
  }, []);

  const signIn = async (cleanEmail) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setErrorMsg(describeAuthError(error, "login"));
      return;
    }

    // The previous build redirected whenever no error came back, which let a
    // rejected sign-in land on /setup as though it had worked. Require a real
    // session before navigating anywhere.
    if (!data?.session) {
      setErrorMsg(
        "That sign-in did not return a session. Check the email and password, or create an account first."
      );
      return;
    }

    router.replace(destinationAfterLogin());
  };

  const signUp = async (cleanEmail) => {
    // No `emailRedirectTo` and no verification screen: the Resend confirmation
    // step is out for Alpha 0.4.0, so accounts are usable immediately.
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (error) {
      setErrorMsg(describeAuthError(error, "signup"));
      return;
    }

    // Supabase masks "this address is taken" to prevent user enumeration: it
    // returns a decoy user with an empty `identities` array and no error at
    // all. The old code read that as success and showed "check your email", so
    // returning testers believed they had registered when nothing happened.
    const identities = data?.user?.identities;
    if (Array.isArray(identities) && identities.length === 0) {
      switchMode("login");
      setEmail(cleanEmail);
      setErrorMsg(
        "That email is already registered. Log in with it below instead of creating a second account."
      );
      return;
    }

    if (data?.session) {
      router.replace("/setup");
      return;
    }

    // No session means the Supabase project still has "Confirm email" switched
    // on. Verification is gone from the product, so finish the sign-in here
    // rather than parking the user on a screen waiting for an email.
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    if (signInData?.session) {
      router.replace("/setup");
      return;
    }

    setErrorMsg(
      describeAuthError(signInError ?? { code: "email_not_confirmed" }, "signup")
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    if (!supabase) {
      setErrorMsg(SUPABASE_MISSING_MESSAGE);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      setErrorMsg("Enter a valid email address, for example you@example.com.");
      return;
    }

    if (!isLogin) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setErrorMsg(
          `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`
        );
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("The two passwords do not match.");
        return;
      }
      if (!termsAccepted) {
        setErrorMsg(
          "You must agree to the Alpha Terms of Service before creating an account."
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await signIn(cleanEmail);
      } else {
        await signUp(cleanEmail);
      }
    } catch (err) {
      setErrorMsg(describeAuthError(err, mode));
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="aero-bg relative flex min-h-screen items-center justify-center">
        <AeroBubbles />
        <p className="relative z-10 animate-pulse text-sm font-semibold text-aero-sky-800">
          Checking your session…
        </p>
      </div>
    );
  }

  return (
    <div className="aero-bg relative flex min-h-screen flex-col items-center justify-center overflow-y-auto p-6">
      <AeroBubbles />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="aero-chip px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
            Alpha 0.4.0
          </span>
          <h1 className="aero-wordmark mt-4 text-4xl font-extrabold tracking-tight">
            PersonAIs
          </h1>
          <p className="mt-1 text-sm text-aero-ink-soft">
            {isLogin
              ? "Sign in with an email you have already registered."
              : "Create your account to build a digital twin."}
          </p>
        </div>

        <div className="aero-panel p-8">
          {/* Mode switch — a real segmented control, so it is obvious which
              form you are on. Mixing the two up was half the signup problem. */}
          <div
            className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-white/80 bg-white/50 p-1"
            role="tablist"
            aria-label="Choose sign in or create account"
          >
            {[
              { key: "login", label: "Log In" },
              { key: "signup", label: "Create Account" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={mode === tab.key}
                onClick={() => switchMode(tab.key)}
                className={
                  mode === tab.key
                    ? "aero-btn px-4 py-2 text-xs"
                    : "rounded-full px-4 py-2 text-xs font-bold text-aero-ink-soft transition-colors hover:text-aero-sky-700"
                }
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {!isSupabaseConfigured && (
            <p
              role="alert"
              className="mb-4 rounded-2xl border border-amber-300 bg-amber-50/90 px-4 py-3 text-xs font-semibold text-amber-800"
            >
              {SUPABASE_MISSING_MESSAGE}
            </p>
          )}

          {errorMsg && (
            <p
              role="alert"
              className="mb-4 rounded-2xl border border-red-300 bg-red-50/90 px-4 py-3 text-xs font-semibold leading-relaxed text-red-700"
            >
              {errorMsg}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block px-2 text-xs font-bold text-aero-sky-800"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="aero-field px-5 py-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block px-2 text-xs font-bold text-aero-sky-800"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder={
                  isLogin ? "Your password" : `At least ${MIN_PASSWORD_LENGTH} characters`
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={isLogin ? undefined : MIN_PASSWORD_LENGTH}
                className="aero-field px-5 py-3 text-sm"
              />
            </div>

            {!isLogin && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block px-2 text-xs font-bold text-aero-sky-800"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Type it once more"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  className="aero-field px-5 py-3 text-sm"
                />
                <p className="mt-1.5 px-2 text-[11px] leading-relaxed text-aero-ink-soft">
                  There is no password-reset email in this release, so a typo
                  here cannot be undone.
                </p>
              </div>
            )}

            {!isLogin && (
              <div className="mt-4 rounded-2xl border border-white/80 bg-white/55 p-4">
                <ul className="mb-3 space-y-1.5">
                  {TERMS_HIGHLIGHTS.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex gap-2 text-[11px] leading-relaxed text-aero-ink-soft"
                    >
                      <span aria-hidden="true" className="text-aero-grass-600">
                        ●
                      </span>
                      {highlight}
                    </li>
                  ))}
                </ul>

                <div className="flex items-start gap-3 border-t border-white/80 pt-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    className="mt-0.5 h-4 w-4 flex-none cursor-pointer accent-aero-grass-500"
                  />
                  <label
                    htmlFor="terms"
                    className="cursor-pointer text-xs leading-relaxed text-aero-ink-soft"
                  >
                    I have read and agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="font-bold text-aero-sky-700 underline underline-offset-2 hover:text-aero-sky-900"
                    >
                      Alpha Terms of Service ({TERMS_VERSION})
                    </button>
                    , including database resets, usage caps, and the removal of
                    email verification for this release.
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isSupabaseConfigured}
              className={`aero-btn ${
                isLogin ? "" : "aero-btn--grass"
              } mt-5 w-full py-3.5 text-sm`}
            >
              <span>
                {isLoading
                  ? "Working…"
                  : isLogin
                    ? "Log In"
                    : "Create Account"}
              </span>
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-aero-ink-soft">
            {isLogin ? "No account yet?" : "Already registered?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isLogin ? "signup" : "login")}
              className="font-bold text-aero-sky-700 underline underline-offset-2 hover:text-aero-sky-900"
            >
              {isLogin ? "Create one now." : "Log in instead."}
            </button>
          </p>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-aero-ink-soft">
          Alpha builds are wiped without notice.{" "}
          <Link
            href="/legal"
            className="font-bold text-aero-sky-700 underline underline-offset-2"
          >
            Read the full alpha terms
          </Link>
          .
        </p>
      </div>

      <TermsDialog
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setShowTerms(false);
        }}
      />
    </div>
  );
}
