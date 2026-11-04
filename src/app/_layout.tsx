import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import React from "react";

import { useSupabaseAutoRefresh } from "@/hooks/use-supabase-auto-refresh";
import { AuthProvider, useAuth } from "@/providers/auth-provider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  useSupabaseAutoRefresh();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: "#F6F8F5",
        }}
      >
        <ActivityIndicator
          accessibilityLabel="Restoring your session"
          color="#174B35"
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="index" />
          <Stack.Screen name="classes" />
          <Stack.Screen name="feedback-reports" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Screen name="auth/callback" />
      </Stack>
    </>
  );
}
