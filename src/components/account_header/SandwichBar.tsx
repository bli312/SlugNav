import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Animated, Easing } from "react-native";
import { MaterialDesignIcons as Icon } from "@react-native-vector-icons/material-design-icons";

import SandwichIcons from "./SandwichIcons";

interface SandwichBarProps {
  busy: boolean;
  onSignOut?: () => void;
  onNavigateClasses?: () => void;
  onNavigateFeedbackReports?: () => void;
  onNavigateLeaderboard?: () => void;
  onNavigateSettings?: () => void;
}

// material design icons does not use react native stylesheet
// create custom icon style sheet to "mimic" it
export interface IconStyleSheet {
  size: number;
  color: string;
}

export default function SandwichBar({
  busy,
  onSignOut,
  onNavigateClasses,
  onNavigateFeedbackReports,
  onNavigateLeaderboard,
  onNavigateSettings,
}: SandwichBarProps) {
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: open ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [open, animation]);

  const iconStyles: IconStyleSheet = {
    size: 32.5,
    color: "#555",
  };

  const translateX = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    }),
    rotate = animation.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "-180deg"],
    }),
    barWidth = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [42.5, 250],
    });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
          },
        ]}
      >
        <Animated.View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            opacity: animation,
            transform: [{ translateX }],
          }}
          pointerEvents={open ? "auto" : "none"}
          accessible={open}
          accessibilityElementsHidden={!open}
          importantForAccessibility={open ? "auto" : "no-hide-descendants"}
        >
          <SandwichIcons
            busy={busy}
            setOpen={setOpen}
            iconStyles={iconStyles}
            onSignOut={onSignOut}
            onNavigateClasses={onNavigateClasses}
            onNavigateFeedbackReports={onNavigateFeedbackReports}
            onNavigateLeaderboard={onNavigateLeaderboard}
            onNavigateSettings={onNavigateSettings}
          />
        </Animated.View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Icon
            name={
              !open
                ? "account-circle-outline"
                : "arrow-left-drop-circle-outline"
            }
            size={iconStyles.size}
            color="#0084ff"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Toggle Sandwich"
            onPress={() => setOpen((prev) => !prev)}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: -20,
    right: 0,
    zIndex: 1000,
    overflow: "visible",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
    backgroundColor: "#fffefb",
    padding: 5,
    borderRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
});
