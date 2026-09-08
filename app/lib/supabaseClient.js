import { createClient } from "@supabase/supabase-js";

// `NEXT_PUBLIC_*` values are inlined at build time, so they have to be read as
// full literal member expressions — destructuring `process.env` breaks it.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// `createClient` throws when the URL or key is blank. Previously every page
// built its own client at module scope, so a missing env var took the whole
// route down with a white screen. Guard it once here instead and let the UI
// explain what is wrong.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const SUPABASE_MISSING_MESSAGE =
  "Connection keys are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then reload.";

/** Resolves the current session, or null when Supabase is unconfigured. */
export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data?.session ?? null;
}
