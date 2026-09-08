/**
 * Supabase auth failures arrive as terse, developer-facing strings
 * ("Invalid login credentials"). Alpha testers were reading those as "the app
 * is broken" rather than "that account does not exist yet", so every error is
 * translated into something that says what to do next.
 */

export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value).trim());
}

/**
 * True when Supabase is telling us the address already has an account.
 *
 * Which shape this arrives in depends on the project's Confirm Email setting:
 * with confirmations OFF the API returns a `user_already_exists` error, and
 * with them ON it hides the collision behind a decoy user instead (handled at
 * the call site). Both mean the same thing to the user.
 */
export function isAlreadyRegisteredError(error) {
  if (!error) return false;
  const code = error.code ?? "";
  const raw = String(error.message ?? "").toLowerCase();
  return (
    code === "user_already_exists" ||
    code === "email_exists" ||
    raw.includes("already registered") ||
    raw.includes("user already registered")
  );
}

/**
 * @param {unknown} error   Error thrown or returned by supabase-js.
 * @param {"login"|"signup"} mode Which form the user was submitting.
 * @returns {string} A message safe to show in the UI.
 */
export function describeAuthError(error, mode) {
  if (!error) return "Something went wrong. Please try again.";

  const code = error.code ?? "";
  const status = error.status ?? 0;
  const raw = String(error.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || raw.includes("invalid login credentials")) {
    return mode === "login"
      ? "No account matches that email and password. If you have not registered yet, switch to Create Account first."
      : "Those credentials were rejected. Double-check the email and password.";
  }

  if (code === "email_not_confirmed" || raw.includes("email not confirmed")) {
    return "This account was created while email confirmation was still switched on. Turn off Confirm Email in Supabase (Authentication → Sign In / Providers → Email), or confirm the address once, then log in again.";
  }

  if (isAlreadyRegisteredError(error)) {
    return "That email is already registered. Log in with it instead.";
  }

  if (code === "weak_password" || raw.includes("password should be")) {
    return `Password is too weak. Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (code === "signup_disabled" || raw.includes("signups not allowed")) {
    return "New registrations are paused on this instance. Contact the PersonAIs team for alpha access.";
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    status === 429
  ) {
    return "Too many attempts in a short window. Wait about a minute and try again.";
  }

  if (code === "validation_failed" || raw.includes("unable to validate email")) {
    return "That email address does not look valid. Check it and try again.";
  }

  if (raw.includes("failed to fetch") || raw.includes("networkerror")) {
    return "Could not reach the authentication service. Check your connection and try again.";
  }

  return error.message || "Something went wrong. Please try again.";
}
