"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

/**
 * Bounce anyone without a session back to the gateway.
 *
 * The same guard as `/`, `/setup` and `/settings` run inline, pulled into one
 * place because 0.4.4 adds three more pages that need it. Returns while it is
 * still checking, so a page can show its own "verifying" state rather than
 * flashing a signed-in layout at somebody who is not.
 */
export function useRequireSession() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  // Nothing to verify when Supabase was never configured, so start settled.
  const [isAuthenticating, setIsAuthenticating] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return undefined;

    let cancelled = false;

    const applySession = (session) => {
      if (cancelled) return;
      if (!session?.user) {
        router.replace("/auth");
        return;
      }
      setUserId(session.user.id);
      setIsAuthenticating(false);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => applySession(data?.session))
      .catch(() => {
        if (!cancelled) router.replace("/auth");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => applySession(session));

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [router]);

  return { userId, isAuthenticating, isSupabaseConfigured };
}
