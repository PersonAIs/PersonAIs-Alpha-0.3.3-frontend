/**
 * Colour themes (Alpha 0.4.5).
 *
 * The look is always Frutiger Aero; its colour is the person's choice, from
 * Aero's own sky and grass or any of the basic colours. A theme is a set of
 * token values in app/globals.css, switched on by setting data-theme on
 * <html>. The choice lives in this browser's localStorage — like the reference
 * photo, it is not sent to the engine.
 *
 * Deliberately not a client module: the root layout (a Server Component)
 * imports THEME_BOOT_SCRIPT from here. Only call the other helpers in the
 * browser.
 */

export const THEME_STORAGE_KEY = "personais_theme";
export const DEFAULT_THEME = "aero";

// Fired on window when this tab changes the theme. Other tabs hear the
// `storage` event instead.
export const THEME_CHANGE_EVENT = "personais:theme";

// `swatch` is the theme's two accents as a button shows them, for the picker;
// `themeColor` tints the browser's own toolbar on mobile. Both mirror values
// in globals.css — change them together.
export const THEMES = [
  { id: "aero", label: "Aero", hint: "The original", swatch: ["#23a7e0", "#4bb733"], themeColor: "#b6e6fb" },
  { id: "red", label: "Red", swatch: ["#ff5956", "#f56d00"], themeColor: "#ffd6d6" },
  { id: "orange", label: "Orange", swatch: ["#f36d00", "#d58800"], themeColor: "#ffdbb1" },
  { id: "yellow", label: "Yellow", swatch: ["#ebcc00", "#71b100"], themeColor: "#f3e57a" },
  { id: "green", label: "Green", swatch: ["#00b953", "#00b4a2"], themeColor: "#b4f3ca" },
  { id: "blue", label: "Blue", swatch: ["#5a98ff", "#a182ff"], themeColor: "#cee4ff" },
  { id: "purple", label: "Purple", swatch: ["#b772ff", "#e741ff"], themeColor: "#ebd9ff" },
  { id: "pink", label: "Pink", swatch: ["#ff46a3", "#ff596f"], themeColor: "#ffd3ec" },
  { id: "brown", label: "Brown", swatch: ["#c78b66", "#d58800"], themeColor: "#f3ddce" },
  { id: "grey", label: "Grey", swatch: ["#899cb7", "#9a9aa5"], themeColor: "#dce2ea" },
];

export const THEME_IDS = THEMES.map((theme) => theme.id);

export function isThemeId(value) {
  return THEME_IDS.includes(value);
}

/** The saved theme, or Aero when there is none (or storage is blocked). */
export function readStoredTheme() {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(value) ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Dress the page in a theme. Aero is the absence of an attribute. */
export function applyTheme(id) {
  const theme = THEMES.find((option) => option.id === id) || THEMES[0];
  const root = document.documentElement;
  if (theme.id === DEFAULT_THEME) {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme.id);
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme.themeColor);
  return theme.id;
}

/** Apply a theme and remember it in this browser. */
export function saveTheme(id) {
  const applied = applyTheme(id);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, applied);
  } catch {
    // Storage refused (private mode, quota): the theme holds for this visit.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  return applied;
}

// Runs in <head> while the HTML is still being parsed, so the first paint is
// already in the saved colour. Only known ids are applied, so a stale or
// hand-edited value falls back to Aero instead of to an unstyled attribute.
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(${JSON.stringify(
  THEME_IDS.filter((id) => id !== DEFAULT_THEME)
)}.indexOf(t)>-1)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
