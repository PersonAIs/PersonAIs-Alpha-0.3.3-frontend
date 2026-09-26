"use client";
import { useSyncExternalStore } from "react";
import {
  DEFAULT_THEME,
  THEMES,
  THEME_CHANGE_EVENT,
  readStoredTheme,
  saveTheme,
} from "../lib/theme";

function subscribe(onChange) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

/**
 * The colour picker on /settings. Picking is instant: the whole app — this
 * page included — is the preview, so there is no Save button to forget.
 *
 * Storage is the source of truth, shared with the boot script in the root
 * layout and with other tabs; the server renders Aero and hydration catches up.
 */
export default function ThemePicker() {
  const current = useSyncExternalStore(subscribe, readStoredTheme, () => DEFAULT_THEME);

  return (
    <fieldset>
      <legend className="sr-only">Theme colour</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {THEMES.map((theme) => {
          const selected = theme.id === current;
          return (
            <label
              key={theme.id}
              className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border px-2 pt-4 pb-3 text-center transition-colors has-focus-visible:ring-2 has-focus-visible:ring-aero-sky-500 ${
                selected
                  ? "border-aero-sky-400 bg-white/90"
                  : "border-white/80 bg-white/50 hover:border-aero-sky-300 hover:bg-white/75"
              }`}
            >
              <input
                type="radio"
                name="theme-colour"
                value={theme.id}
                checked={selected}
                onChange={() => saveTheme(theme.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="aero-swatch"
                style={{ "--swatch-a": theme.swatch[0], "--swatch-b": theme.swatch[1] }}
              />
              <span className="text-xs font-bold text-aero-ink">
                {theme.label}
                {theme.hint && (
                  <span className="block text-[10px] font-semibold text-aero-ink-soft">
                    {theme.hint}
                  </span>
                )}
              </span>
              {selected && (
                <span
                  aria-hidden="true"
                  className="aero-fill absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold"
                >
                  ✓
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
