import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";

export default function LoginScreen() {
  const { signIn, busy, error } = useAuth();
  const configured = isSupabaseConfigured();
  const disabled = busy || !configured;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.wordmark}>SlugNav</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Your campus, connected.
        </Text>
        <Text style={styles.description}>
          Sign in with your UCSC Google account to get started.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in with Google"
          accessibilityState={{ disabled, busy }}
          disabled={disabled}
          onPress={() => void signIn()}
          style={({ pressed }) => [
            styles.button,
            (pressed || disabled) && styles.buttonDimmed,
          ]}
        >
          <Image
            // Metro resolves bundled images through require.
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            source={require("../assets/google-sign-in.png")}
            style={styles.googleButton}
            accessible={false}
          />
        </Pressable>
        {busy && (
          <ActivityIndicator accessibilityLabel="Signing in" color="#174B35" />
        )}
        <Text style={styles.note}>Available to @ucsc.edu accounts.</Text>
        {error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}
        {!configured && (
          <Text style={styles.note}>
            Sign-in is not configured in this app yet.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F8F5" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignSelf: "center",
    width: "100%",
    maxWidth: 480,
    padding: 32,
    gap: 20,
  },
  wordmark: { color: "#174B35", fontSize: 28, fontWeight: "700" },
  title: { color: "#1D2E24", fontSize: 36, fontWeight: "700" },
  description: { color: "#526259", fontSize: 18, lineHeight: 26 },
  button: { alignSelf: "flex-start", justifyContent: "center", minHeight: 48 },
  buttonDimmed: { opacity: 0.55 },
  googleButton: { width: 180, height: 40 },
  note: { color: "#526259", fontSize: 14, lineHeight: 21 },
  error: { color: "#A12828", fontSize: 15, lineHeight: 22 },
});
