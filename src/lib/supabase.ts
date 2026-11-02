import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getRandomValues } from "expo-crypto";
import { Platform } from "react-native";

// Expo replaces these exact property references when it builds the app.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: ReturnType<typeof createClient> | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && publishableKey);
}

/**
 * Use this shared client for auth and database requests. Creating it lazily lets
 * teammates work on screens before configuring their local Supabase connection.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local, add the project publishable key, and restart Expo.",
    );
  }

  const parsedUrl = new URL(url);
  if (
    !["https:", "http:"].includes(parsedUrl.protocol) ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error("Use the Supabase project API URL, not its dashboard URL.");
  }

  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error(
      "Use a Supabase publishable key (sb_publishable_), never a secret or service-role key.",
    );
  }

  // Hermes needs a secure random source for Supabase's PKCE verifier.
  if (Platform.OS !== "web" && !globalThis.crypto?.getRandomValues) {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: { ...globalThis.crypto, getRandomValues },
    });
  }

  client = createClient(url, publishableKey, {
    auth: {
      ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  });

  return client;
}
