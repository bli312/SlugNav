import { Stack } from "expo-router";
import React from "react";

import FeedbackReportsScreen from "@/components/places/FeedbackReportsScreen";

export default function FeedbackReportsRoute() {
  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: "Feedback and Reports" }}
      />
      <FeedbackReportsScreen />
    </>
  );
}
