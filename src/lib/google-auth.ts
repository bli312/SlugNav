import Constants, { ExecutionEnvironment } from "expo-constants";
import {
  CryptoDigestAlgorithm,
  CryptoEncoding,
  digestStringAsync,
} from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import {
  AUTH_CALLBACK_PATH,
  NATIVE_AUTH_CALLBACK,
  requireS256Challenge,
} from "./oauth";
import { getSupabase } from "./supabase";

export function getAuthRedirectUrl(): string {
  return Platform.OS === "web"
    ? new URL(AUTH_CALLBACK_PATH, window.location.origin).href
    : NATIVE_AUTH_CALLBACK;
}

export const isExpoGo =
  Platform.OS !== "web" &&
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Returns a native callback URL, or null when cancelled / redirecting on web. */
export async function openGoogleSignIn(): Promise<string | null> {
  if (isExpoGo) {
    throw new Error(
      "Google sign-in needs a development build on phones. Use the web app to test it now.",
    );
  }

  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await getSupabase().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: "openid email profile",
      // Google account-picker hint; Supabase enforces signup eligibility.
      queryParams: { hd: "ucsc.edu", prompt: "select_account" },
    },
  });
  if (error) throw error;

  // Expo Crypto supplies SHA-256 on Hermes; Supabase stores and exchanges the verifier.
  const authorizeUrl = await requireS256Challenge(data.url, (verifier) =>
    digestStringAsync(CryptoDigestAlgorithm.SHA256, verifier, {
      encoding: CryptoEncoding.BASE64,
    }),
  );

  if (Platform.OS === "web") {
    window.location.assign(authorizeUrl);
    return null;
  }

  const result = await WebBrowser.openAuthSessionAsync(
    authorizeUrl,
    redirectTo,
  );
  return result.type === "success" ? result.url : null;
}
