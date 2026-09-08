"use client";
import { useEffect, useRef } from "react";
import {
  TERMS_EFFECTIVE_DATE,
  TERMS_SECTIONS,
  TERMS_SUMMARY,
  TERMS_VERSION,
} from "../lib/legal";

/**
 * Full text of the temporary alpha terms, shown over the signup form so people
 * can actually read what the checkbox commits them to.
 */
export default function TermsDialog({ open, onClose, onAccept }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-aero-sky-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-dialog-title"
      onClick={onClose}
    >
      <div
        className="aero-panel flex max-h-[85vh] w-full max-w-2xl flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/70 px-7 pt-7 pb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-aero-sky-600">
            Version {TERMS_VERSION} · Effective {TERMS_EFFECTIVE_DATE}
          </p>
          <h2
            id="terms-dialog-title"
            className="aero-wordmark mt-1 text-2xl font-extrabold tracking-tight"
          >
            PersonAIs Alpha Terms of Service
          </h2>
          <p className="mt-2 text-sm text-aero-ink-soft">{TERMS_SUMMARY}</p>
        </div>

        <div className="aero-scroll flex-1 space-y-6 overflow-y-auto px-7 py-6">
          {TERMS_SECTIONS.map((section) => (
            <section key={section.id}>
              <h3 className="text-sm font-bold text-aero-sky-800">{section.title}</h3>
              {section.body.map((paragraph, index) => (
                <p key={index} className="mt-2 text-sm leading-relaxed text-aero-ink-soft">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/70 px-7 py-5 sm:flex-row sm:justify-end">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="aero-btn aero-btn--glass px-6 py-2.5 text-sm"
          >
            <span>Close</span>
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="aero-btn aero-btn--grass px-6 py-2.5 text-sm"
          >
            <span>I agree to these terms</span>
          </button>
        </div>
      </div>
    </div>
  );
}
