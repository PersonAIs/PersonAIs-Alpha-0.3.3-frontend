"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  BETA_LAUNCH,
  PREORDER_MAX_TERM,
  PREORDERS_OPEN,
  dismissAnnouncement,
  isAnnouncementDismissed,
} from "../lib/announcements";

/**
 * The 0.4.6 popup on the main page: when Beta launches, and when pre-orders
 * open. Shown once per browser.
 *
 * A native <dialog> opened with showModal(), so the browser keeps focus inside
 * it, makes the chat behind it inert and closes it on Escape. However it is
 * closed (Escape, the backdrop, either button) the dismissal is remembered.
 */
export default function BetaAnnouncement() {
  const dialogRef = useRef(null);
  const gotItRef = useRef(null);
  // Storage only exists in the browser, so the server renders no popup. A
  // dismissal in another tab does not reach in and close this one.
  const wasDismissed = useSyncExternalStore(
    subscribeToNothing,
    isAnnouncementDismissed,
    () => true
  );
  const [isClosed, setIsClosed] = useState(false);
  const isOpen = !wasDismissed && !isClosed;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog || dialog.open) return;
    dialog.showModal();
    // Start on the button that only closes it, not on the link that leaves.
    gotItRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const close = () => dialogRef.current?.close();

  const handleClose = () => {
    dismissAnnouncement();
    setIsClosed(true);
  };

  // A click that lands on the dialog itself rather than the panel inside it is
  // a click on the backdrop.
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) close();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={handleBackdropClick}
      aria-labelledby="announcement-title"
      aria-describedby="announcement-dates"
      className="m-auto w-[calc(100%-2rem)] max-w-lg overflow-visible bg-transparent p-0 text-aero-ink backdrop:bg-aero-sky-900/40 backdrop:backdrop-blur-sm"
    >
      <div className="aero-panel flex max-h-[calc(100dvh-3rem)] flex-col">
        <div className="aero-scroll overflow-y-auto px-7 pt-7 pb-2">
          <span className="aero-chip px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
            Alpha 0.4.6 · Coming up
          </span>
          <h2
            id="announcement-title"
            className="aero-wordmark mt-4 text-3xl font-extrabold tracking-tight"
          >
            PersonAIs Beta is on its way
          </h2>
          <p className="mt-2 text-sm text-aero-ink-soft">Two dates for your calendar.</p>

          <ul id="announcement-dates" className="mt-6 space-y-3">
            <li className="flex gap-4 rounded-2xl border border-white/80 bg-white/60 p-4">
              <span aria-hidden="true" className="text-2xl leading-none">
                🚀
              </span>
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-aero-sky-600">
                  <time dateTime={BETA_LAUNCH.iso}>{BETA_LAUNCH.label}</time>
                </span>
                <span className="mt-1 block font-bold text-aero-sky-800">Beta launches</span>
                <span className="mt-1 block text-sm text-aero-ink-soft">
                  The next version of PersonAIs goes live.
                </span>
              </span>
            </li>
            <li className="flex gap-4 rounded-2xl border border-white/80 bg-white/60 p-4">
              <span aria-hidden="true" className="text-2xl leading-none">
                🎟️
              </span>
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-aero-grass-700">
                  <time dateTime={PREORDERS_OPEN.iso}>{PREORDERS_OPEN.label}</time>
                </span>
                <span className="mt-1 block font-bold text-aero-sky-800">Pre-orders go live</span>
                <span className="mt-1 block text-sm text-aero-ink-soft">
                  Subscribe for up to {PREORDER_MAX_TERM}. Every subscription
                  starts the day Beta launches, so none of it is used up before
                  then.
                </span>
              </span>
            </li>
          </ul>

          <p className="mt-4 text-xs text-aero-ink-soft">
            Nothing can be bought yet: no payment is taken in this build.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 px-7 pt-4 pb-7 sm:flex-row sm:justify-end">
          <button
            ref={gotItRef}
            type="button"
            onClick={close}
            className="aero-btn aero-btn--glass px-6 py-2.5 text-sm"
          >
            <span>Got it</span>
          </button>
          {/* Dismissed here rather than by the close event: the navigation can
              unmount the page before that event fires. */}
          <Link
            href="/pricing"
            onClick={dismissAnnouncement}
            className="aero-btn aero-btn--grass px-6 py-2.5 text-sm"
          >
            <span>See the plans</span>
          </Link>
        </div>
      </div>
    </dialog>
  );
}

function subscribeToNothing() {
  return () => {};
}
