/**
 * Copy for credits and the daily discussion allowance (Alpha 0.4.5).
 *
 * The engine counts each person's allowance per UTC day and says when it next
 * resets; these turn that into sentences in the reader's own clock. Only call
 * them with data fetched in the browser — they read the local time zone.
 */

/** "1 credit", "3 credits" — a count nobody has to read twice. */
export function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** When the allowance comes back, locally: "at 8:00 PM" or "tomorrow at 1:00 AM". */
export function resetPhrase(iso, now = new Date()) {
  const reset = iso ? new Date(iso) : null;
  if (!reset || Number.isNaN(reset.getTime())) return "after midnight UTC";
  const time = reset.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  // A reset is never more than a day away, so another date means tomorrow.
  return reset.toDateString() === now.toDateString() ? `at ${time}` : `tomorrow at ${time}`;
}

/** Whether a daily allowance applies and could be counted. */
export function hasDailyLimit(conversation) {
  return conversation?.daily_limit != null && conversation?.my_daily_left != null;
}

/** Why the twins cannot go another round right now, as one sentence. */
export function blockedMessage(conversation, partnerName = "Your friend") {
  if (!conversation) return "";
  const limit = conversation.daily_limit;
  if (conversation.blocked_reason === "daily_limit") {
    if (limit === 0) {
      return "Twin rounds are paused for now. You can still type to each other.";
    }
    const who = conversation.my_daily_left === 0 ? "You have" : `${partnerName} has`;
    return (
      `${who} used today's ${plural(limit, "discussion credit")}. ` +
      `The twins can carry on ${resetPhrase(conversation.daily_resets_at)}.`
    );
  }
  // Anything else is the engine's own sentence. An engine older than 0.4.5
  // sends no blocked_detail, and the only thing that stopped its twins was
  // money.
  return (
    conversation.blocked_detail ||
    conversation.stop_detail ||
    "No credits left for another round."
  );
}
