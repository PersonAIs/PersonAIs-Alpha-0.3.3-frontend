/**
 * Release announcements (Alpha 0.4.6).
 *
 * The Beta date and the pre-order date live here once, so the popup on the
 * main page and the Plans page cannot disagree about them. Both are 2026 dates
 * with no time of day attached, so they are written out rather than formatted
 * from a Date: "2026-10-03" parsed as a Date is midnight UTC, which reads as
 * October 2 anywhere west of Greenwich.
 *
 * Nothing here takes a payment. Pre-orders are announced, not wired up.
 */

export const BETA_LAUNCH = { iso: "2026-10-31", label: "Saturday, October 31" };
export const PREORDERS_OPEN = { iso: "2026-10-03", label: "Saturday, October 3" };

// The longest pre-order subscription. Every subscription starts on Beta.
export const PREORDER_MAX_TERM = "2 years";

// A dismissed announcement stays dismissed in this browser. Give the next one a
// new id and everybody sees it once, whatever they dismissed before.
export const ANNOUNCEMENT_ID = "beta-and-preorders-0.4.6";
const ANNOUNCEMENT_STORAGE_KEY = "personais_announcement_dismissed";

/** Whether this browser has already dismissed the current announcement. */
export function isAnnouncementDismissed() {
  try {
    return window.localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY) === ANNOUNCEMENT_ID;
  } catch {
    // Storage blocked: show it, and let the dismissal hold until the page is
    // next opened.
    return false;
  }
}

/** Remember that this browser has seen the current announcement. */
export function dismissAnnouncement() {
  try {
    window.localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, ANNOUNCEMENT_ID);
  } catch {
    // Storage refused (private mode, quota): it shows again next visit.
  }
}
