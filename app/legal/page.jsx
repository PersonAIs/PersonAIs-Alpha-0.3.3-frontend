import Link from "next/link";
import AeroBubbles from "../components/AeroBubbles";
import {
  TERMS_EFFECTIVE_DATE,
  TERMS_SECTIONS,
  TERMS_SUMMARY,
  TERMS_VERSION,
} from "../lib/legal";

export const metadata = {
  title: "Alpha Terms of Service",
  description:
    "Temporary terms of service for the PersonAIs Alpha 0.4.0 test build.",
};

export default function LegalPage() {
  return (
    <div className="aero-bg relative min-h-full overflow-y-auto">
      <AeroBubbles />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        <Link href="/auth" className="aero-btn aero-btn--glass mb-8 px-5 py-2.5 text-sm">
          <span>← Back to sign in</span>
        </Link>

        <div className="aero-panel p-8 md:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-aero-sky-600">
            Version {TERMS_VERSION} · Effective {TERMS_EFFECTIVE_DATE}
          </p>
          <h1 className="aero-wordmark mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
            PersonAIs Alpha Terms of Service
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-aero-ink-soft">{TERMS_SUMMARY}</p>

          <div className="mt-8 space-y-7 border-t border-white/70 pt-8">
            {TERMS_SECTIONS.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-base font-bold text-aero-sky-800">{section.title}</h2>
                {section.body.map((paragraph, index) => (
                  <p
                    key={index}
                    className="mt-2 text-sm leading-relaxed text-aero-ink-soft"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <p className="mt-10 rounded-2xl border border-white/70 bg-white/50 p-4 text-xs leading-relaxed text-aero-ink-soft">
            These are interim terms for a pre-release test build, written in plain
            language rather than as a finished commercial agreement. They will be
            replaced by full terms of service and a privacy policy before
            PersonAIs leaves alpha.
          </p>
        </div>
      </div>
    </div>
  );
}
