import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { MaterialDesignIcons as Icon } from "@react-native-vector-icons/material-design-icons";

import SandwichIcons from "./SandwichIcons";

interface SandwichBarProps {
  busy: boolean;
  onSignOut?: () => void;
  onNavigateClasses?: () => void;
  onNavigateFeedbackReports?: () => void;
  onNavigateLeaderboard?: () => void;
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
}: SandwichBarProps) {
  const [open, setOpen] = useState(false);
  const iconStyles: IconStyleSheet = {
    size: 37.5,
    color: "#777",
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {open && (
          <SandwichIcons
            busy={busy}
            setOpen={setOpen}
            iconStyles={iconStyles}
            onSignOut={onSignOut}
            onNavigateClasses={onNavigateClasses}
            onNavigateFeedbackReports={onNavigateFeedbackReports}
            onNavigateLeaderboard={onNavigateLeaderboard}
          />
        )}
        <Icon
          name={
            !open ? "account-circle-outline" : "arrow-right-drop-circle-outline"
          }
          size={iconStyles.size}
          color="#555"
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Toggle Sandwich"
          onPress={() => setOpen((prevState) => !prevState)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: -25,
    right: 0,
    zIndex: 1000,
    overflow: "visible",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "white",
    padding: 5,
    borderRadius: 8,
    elevation: 5,
  },
});
