import * as Linking from "expo-linking";
import { Redirect, router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-provider";

export default function AuthCallbackScreen() {
  const link = Linking.useLinkingURL();
  const webUrl = useRef(Platform.OS === "web" ? window.location.href : null);
  const callbackUrl = webUrl.current ?? link;
  const { completeSignIn, session } = useAuth();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!callbackUrl) return;
    let mounted = true;
    void completeSignIn(callbackUrl)
      .then(() => {
        if (mounted) setDone(true);
      })
      .catch((callbackError: unknown) => {
        if (mounted)
          setError(
            callbackError instanceof Error
              ? callbackError.message
              : "Sign-in failed. Please try again.",
          );
      });
    return () => {
      mounted = false;
    };
  }, [callbackUrl, completeSignIn]);

  if (done) return <Redirect href={session ? "/" : "/login"} />;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        {error ? (
          <>
            <Text accessibilityRole="header" style={styles.title}>
              Couldn’t sign you in
            </Text>
            <Text accessibilityRole="alert" style={styles.message}>
              {error}
            </Text>
            <Button
              title="Back to sign in"
              color="#174B35"
              onPress={() => router.replace("/login")}
            />
          </>
        ) : (
          <>
            <ActivityIndicator color="#174B35" />
            <Text style={styles.message}>Finishing sign-in…</Text>
          </>
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
  title: { color: "#174B35", fontSize: 24, fontWeight: "700" },
  message: { color: "#526259", fontSize: 16, lineHeight: 24 },
});
