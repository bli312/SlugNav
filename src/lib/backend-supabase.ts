import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  // if client already exists, no longer need to recreate
  if (client) return client;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.BACKEND_SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    const missing = [];
    if (!url) missing.push("EXPO_PUBLIC_SUPABASE_URL");
    if (!secretKey) missing.push("BACKEND_SUPABASE_SECRET_KEY");
    throw new Error(`Missing ${missing.join(" and ")}`);
  }

  client = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}
