import { Stack } from "expo-router";
import React from "react";

import ClassListScreen from "@/features/classes/ClassListScreen";

// Route /classes. The root layout hides headers, so show one here for the back button.
export default function ClassesRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Classes" }} />
      <ClassListScreen />
    </>
  );
}
