import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

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
export function getSupabase() {
  if (client) return client;

  if (!url || !publishableKey) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env.local, add the project publishable key, and restart Expo.',
    );
  }

  const parsedUrl = new URL(url);
  if (
    !['https:', 'http:'].includes(parsedUrl.protocol) ||
    parsedUrl.pathname !== '/' ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error('Use the Supabase project API URL, not its dashboard URL.');
  }

  if (!publishableKey.startsWith('sb_publishable_')) {
    throw new Error('Use a Supabase publishable key (sb_publishable_), never a secret or service-role key.');
  }

  client = createClient(url, publishableKey, {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return client;
}
