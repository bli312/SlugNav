import React from "react";
import { Stack } from "expo-router";
import MyPhotosScreen from "@/components/places/MyPhotosScreen";

export default function MyPhotosRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "My photos" }} />
      <MyPhotosScreen />
    </>
  );
}
