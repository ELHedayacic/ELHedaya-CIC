import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase env vars are missing. Copy .env.example to .env, add your project URL + anon key, then restart the dev server."
  );
}

// Falls back to harmless placeholders so createClient never throws at import
// time (which used to crash the whole app to a blank white screen before
// React could even render). The app shows a proper setup screen instead —
// see src/components/shared/ConfigNotice.tsx and src/main.tsx.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Required for the forgot-password and staff-invite email links to
      // work: both land the user back on the app with tokens in the URL,
      // which this setting picks up automatically to establish a session.
      detectSessionInUrl: true,
    },
  }
);
