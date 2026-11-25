import React from "react";
import { Stack } from "expo-router";
import SettingsScreen from "@/components/settings/SettingsScreen";

export default function SettingsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Settings" }} />
      <SettingsScreen />
    </>
  );
}
