import { Stack } from "expo-router";
import React from "react";

import LeaderboardScreen from "@/components/leaderboard/LeaderboardScreen";

export default function LeaderboardRoute() {
  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: "Campus Leaderboard" }}
      />
      <LeaderboardScreen />
    </>
  );
}
