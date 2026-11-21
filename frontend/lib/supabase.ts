import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

console.log("SUPABASE CONFIG CHECK:", {
  urlPresent: Boolean(supabaseUrl),
  urlValid: supabaseUrl.startsWith("https://"),
  anonKeyPresent: Boolean(supabaseAnonKey),
  anonKeyLength: supabaseAnonKey.length,
});

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("https://") &&
  supabaseAnonKey.length > 20,
);

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn(
      "Supabase initialization failed, falling back to local auth mode:",
      err,
    );
  }
}

export const supabase = supabaseInstance;
