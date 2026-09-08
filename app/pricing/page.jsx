"use client";
import Link from "next/link";
import { useState } from "react";
import AeroBubbles from "../components/AeroBubbles";

const FREE_FEATURES = [
  { label: "Create 1 Digital Twin Avatar", included: true },
  { label: "Claude Haiku 4.5 response engine", included: true },
  { label: "20 messages per 24-hour cycle", included: true },
  { label: "8K cinematic generation", included: false },
];

const FOUNDER_FEATURES = [
  "2 years of Ultra access (starts at Beta)",
  "Uncapped chat limits",
  "Priority GPU queue",
  'Exclusive "Founder" UI badge',
];

export default function PricingPage() {
  const [checkoutMessage, setCheckoutMessage] = useState("");

  const handlePreOrder = (event) => {
    event.preventDefault();
    setCheckoutMessage(
      "Pre-orders are not open yet. Commercial transactions unlock after Alpha Week."
    );
    setTimeout(() => setCheckoutMessage(""), 4000);
  };

  return (
    <div className="relative min-h-full p-6 md:p-12">
      <AeroBubbles />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
        <div className="mb-6 w-full">
          <Link href="/" className="aero-btn aero-btn--glass px-5 py-2.5 text-sm">
            <span>← Return to Matrix</span>
          </Link>
        </div>

        <div className="mb-10 text-center">
          <span className="aero-chip px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
            Alpha 0.4.0
          </span>
          <h1 className="aero-wordmark mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            Upgrade Your Digital Twin
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-aero-ink-soft">
            Test the matrix free this week, or get ready for the Founder
            Pre-Order.
          </p>
        </div>

        {checkoutMessage && (
          <div
            role="status"
            className="aero-panel fixed left-1/2 top-8 z-50 flex -translate-x-1/2 items-center gap-3 px-6 py-4"
          >
            <span aria-hidden="true" className="text-xl">
              ⚠️
            </span>
            <p className="text-sm font-bold text-aero-sky-800">{checkoutMessage}</p>
          </div>
        )}

        <div className="grid w-full grid-cols-1 items-stretch gap-8 md:grid-cols-2">
          <div className="aero-panel flex flex-col p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-aero-ink">Alpha Week Access</h2>
                <p className="mt-1 text-sm text-aero-ink-soft">7-day free trial</p>
              </div>
              <span className="aero-chip border-aero-grass-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-aero-grass-700">
                Active
              </span>
            </div>

            <p className="mb-8 text-4xl font-bold text-aero-ink">
              $0{" "}
              <span className="text-xl font-normal text-aero-ink-soft">/ week</span>
            </p>

            <ul className="mb-8 flex-1 space-y-4 text-sm font-medium text-aero-ink-soft">
              {FREE_FEATURES.map((feature) => (
                <li
                  key={feature.label}
                  className={`flex items-center gap-3 ${feature.included ? "" : "opacity-50"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`text-lg font-bold ${
                      feature.included ? "text-aero-grass-500" : "text-aero-ink-soft"
                    }`}
                  >
                    {feature.included ? "✓" : "✕"}
                  </span>
                  {feature.label}
                  {!feature.included && <span className="sr-only"> (locked)</span>}
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled
              className="aero-btn aero-btn--glass w-full py-4"
            >
              <span>Current Plan</span>
            </button>
          </div>

          <div className="aero-panel flex flex-col p-8 ring-2 ring-aero-grass-300/70">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-aero-sky-800">
                2-Year Founder Pass
              </h2>
              <p className="mt-1 text-sm font-semibold text-aero-grass-700">
                Pre-orders coming soon
              </p>
            </div>

            <p className="mb-8 text-4xl font-bold text-aero-ink">
              $150{" "}
              <span className="text-xl font-normal text-aero-ink-soft">one-time</span>
            </p>

            <ul className="mb-8 flex-1 space-y-4 text-sm font-medium text-aero-ink-soft">
              {FOUNDER_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <span aria-hidden="true" className="text-lg font-bold text-aero-sky-500">
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handlePreOrder}
              className="aero-btn aero-btn--grass w-full py-4 text-base"
            >
              <span>Pre-Order</span>
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-aero-ink-soft">
          Prices, caps and tier features are provisional during the alpha.{" "}
          <Link
            href="/legal"
            className="font-bold text-aero-sky-700 underline underline-offset-2"
          >
            Alpha terms
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
