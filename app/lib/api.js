"use client";
import { supabase } from "./supabaseClient";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://personais-api.net";

/** An error from the engine, carrying the status so callers can branch on it. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// The social endpoints identify the caller by their Supabase access token —
// they ignore any user id in the body — so every call carries one when there
// is a session to take it from.
async function accessToken() {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

function readDetail(data, status) {
  if (typeof data?.detail === "string") return data.detail;
  // FastAPI answers a malformed body with a list of field errors.
  if (Array.isArray(data?.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  return `The engine returned ${status}.`;
}

export async function apiRequest(path, { method = "GET", body, signal } = {}) {
  const token = await accessToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError(
      "Could not reach the PersonAIs engine. Check your connection and try again.",
      0
    );
  }

  // A backend URL pointing at the wrong host answers with HTML, and calling
  // .json() on that throws something unreadable. Say what is actually wrong.
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(
      "The engine returned a non-JSON response. Verify NEXT_PUBLIC_BACKEND_URL.",
      res.status
    );
  }

  const data = await res.json();
  if (!res.ok) throw new ApiError(readDetail(data, res.status), res.status);
  return data;
}

export const apiGet = (path, options) => apiRequest(path, options);

export const apiPost = (path, body, options) =>
  apiRequest(path, { ...options, method: "POST", body: body ?? {} });
