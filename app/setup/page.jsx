"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AeroBubbles from "../components/AeroBubbles";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const AVATAR_STORAGE_KEY = "alpha_avatar_image";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export default function SetupPage() {
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // Nothing to verify when Supabase was never configured, so start settled.
  const [isAuthenticating, setIsAuthenticating] = useState(isSupabaseConfigured);
  const fileInputRef = useRef(null);

  // /setup used to be completely open: anyone who reached the URL — including a
  // failed sign-in that redirected here anyway — could start building a twin.
  useEffect(() => {
    if (!supabase) return undefined;

    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        if (!data?.session?.user) {
          router.replace("/auth");
        } else {
          setIsAuthenticating(false);
        }
      })
      .catch(() => {
        if (!cancelled) router.replace("/auth");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setErrorMsg("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("That file is not an image. Choose a JPG, PNG or WebP photo.");
      return;
    }

    // The preview is kept as a data URL in localStorage, which is capped at a
    // few megabytes — reject oversized files before the write fails.
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrorMsg("That photo is larger than 5 MB. Pick a smaller one.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.onerror = () => setErrorMsg("Could not read that file. Try another photo.");
    reader.readAsDataURL(file);
  };

  const handleGenerate = (event) => {
    event.preventDefault();
    if (!avatarPreview || isScanning) return;

    try {
      window.localStorage.setItem(AVATAR_STORAGE_KEY, avatarPreview);
    } catch {
      setErrorMsg(
        "Your browser refused to store that photo. Try a smaller image, or free up site storage."
      );
      return;
    }

    setIsScanning(true);
    setTimeout(() => router.replace("/"), 3000);
  };

  if (isAuthenticating) {
    return (
      <div className="relative flex h-full items-center justify-center">
        <AeroBubbles />
        <p className="relative z-10 animate-pulse text-sm font-semibold text-aero-sky-800">
          Verifying your session…
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center p-6">
      <AeroBubbles />

      <div className="aero-panel relative z-10 w-full max-w-xl p-8 text-center md:p-10">
        <span className="aero-chip px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
          Step 1 of 1
        </span>
        <h1 className="aero-wordmark mt-4 text-3xl font-extrabold tracking-tight">
          Initialize Digital Twin
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-aero-ink-soft">
          Upload a reference photo of yourself. It stays in this browser and is
          never uploaded to our servers during the alpha.
        </p>

        {errorMsg && (
          <p
            role="alert"
            className="mt-5 rounded-2xl border border-red-300 bg-red-50/90 px-4 py-3 text-xs font-semibold text-red-700"
          >
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleGenerate} className="mt-7 space-y-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[240px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-aero-sky-300 bg-gradient-to-b from-white/70 to-aero-sky-50/60 p-8 transition-colors hover:border-aero-grass-400 hover:bg-white/80"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {avatarPreview ? (
              <span className="relative block h-36 w-36 overflow-hidden rounded-full border-4 border-white shadow-[0_16px_32px_-18px_rgba(12,61,89,0.9)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarPreview}
                  alt="Reference photo preview"
                  className="h-full w-full object-cover"
                />
                {isScanning && (
                  <span className="scanning-laser absolute inset-x-0 top-0 block h-1/3 border-t-4 border-aero-aqua bg-gradient-to-b from-aero-aqua/60 to-transparent" />
                )}
              </span>
            ) : (
              <>
                <span className="mb-4 block text-5xl" aria-hidden="true">
                  📷
                </span>
                <span className="text-sm font-bold text-aero-sky-800">
                  Click to select a photo
                </span>
                <span className="mt-2 block text-xs text-aero-ink-soft">
                  JPG, PNG or WebP · up to 5 MB
                </span>
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={isScanning || !avatarPreview}
            className="aero-btn aero-btn--grass w-full py-4 text-base"
          >
            <span>{isScanning ? "Scanning biometrics…" : "Generate Digital Twin"}</span>
          </button>
        </form>
      </div>

      <style>{`
        .scanning-laser { animation: aero-scan 2s linear infinite; }
        @keyframes aero-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .scanning-laser { animation: none; }
        }
      `}</style>
    </div>
  );
}
