import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialDesignIcons as Icon } from "@react-native-vector-icons/material-design-icons";

import { IconStyleSheet } from "./SandwichBar";

interface SandwichIconProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  iconStyles: IconStyleSheet;
  busy: boolean;
  onSignOut?: () => void;
  onNavigateClasses?: () => void;
  onNavigateFeedbackReports?: () => void;
  onNavigateLeaderboard?: () => void;
  onNavigateSettings?: () => void;
}

export default function SandwichBar({
  setOpen,
  iconStyles,
  busy,
  onSignOut,
  onNavigateClasses,
  onNavigateFeedbackReports,
  onNavigateLeaderboard,
  onNavigateSettings,
}: SandwichIconProps) {
  return (
    <View style={styles.icons}>
      {onNavigateLeaderboard && (
        <Icon
          name="medal-outline"
          size={iconStyles.size}
          color={iconStyles.color}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Leaderboard"
          onPress={() => {
            setOpen(false);
            onNavigateLeaderboard();
          }}
        />
      )}
      {onNavigateFeedbackReports && (
        <Icon
          name="comment-edit-outline"
          size={iconStyles.size}
          color={iconStyles.color}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Feedback and Report"
          onPress={() => {
            setOpen(false);
            onNavigateFeedbackReports();
          }}
        />
      )}
      {onNavigateClasses && (
        <Icon
          name="google-classroom"
          size={iconStyles.size}
          color={iconStyles.color}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Classes"
          onPress={() => {
            setOpen(false);
            onNavigateClasses();
          }}
        />
      )}
      {onNavigateSettings && (
        <Icon
          name="cog-outline"
          size={iconStyles.size}
          color={iconStyles.color}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => {
            setOpen(false);
            onNavigateSettings();
          }}
        />
      )}
      {onSignOut && (
        <Icon
          name="logout"
          size={iconStyles.size}
          color={busy ? "#aaa" : iconStyles.color}
          disabled={busy}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Sign Out"
          onPress={() => {
            if (!busy) {
              setOpen(false);
              onSignOut();
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  icons: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
});
