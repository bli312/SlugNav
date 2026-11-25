import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import FeedbackReportsScreen from "@/components/places/FeedbackReportsScreen";

export default function FeedbackReportsRoute() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Feedback and Reports",
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/my-photos")}
              style={styles.myPhotos}
            >
              <Text style={styles.myPhotosText}>My photos</Text>
            </Pressable>
          ),
        }}
      />
      <FeedbackReportsScreen />
    </>
  );
}

const styles = StyleSheet.create({
  myPhotos: { paddingHorizontal: 12, paddingVertical: 6 },
  myPhotosText: { color: "#174B35", fontSize: 15, fontWeight: "600" },
});
