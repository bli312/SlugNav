import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useReminders } from "@/providers/reminder-provider";

export default function SettingsScreen() {
  const { settings, loading, canSave, saveSettings } = useReminders();
  const [enabled, setEnabled] = useState(false);
  const [minutes, setMinutes] = useState("30");
  const [validation, setValidation] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const edited = useRef(false);
  const native = Platform.OS !== "web";
  const disabled = !native || loading || !canSave;
  useEffect(() => {
    if (!settings) {
      edited.current = false;
      setEnabled(false);
      setMinutes("30");
      setValidation(null);
      setSaved(false);
    } else if (!edited.current) {
      // A background refresh must not discard an unsaved or failed-save draft.
      setEnabled(settings.enabled);
      setMinutes(String(settings.minutesBefore));
    }
  }, [settings]);

  async function save() {
    setSaved(false);
    const value = Number(minutes.trim());
    if (
      !/^\d+$/.test(minutes.trim()) ||
      !Number.isSafeInteger(value) ||
      value <= 0
    ) {
      setValidation(
        "Enter a positive whole number of minutes within the supported range.",
      );
      return;
    }
    setValidation(null);
    const success = await saveSettings({ enabled, minutesBefore: value });
    if (success) edited.current = false;
    setSaved(success);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Notifications
      </Text>
      {!native && (
        <Text>Class notifications are available on iOS and Android.</Text>
      )}
      <View style={styles.row}>
        <Text>Class reminders</Text>
        <Switch
          accessibilityLabel="Notifications"
          value={enabled}
          disabled={disabled}
          accessibilityState={{ disabled, checked: enabled }}
          onValueChange={(value) => {
            edited.current = true;
            setEnabled(value);
            setSaved(false);
          }}
        />
      </View>
      <Text>Minutes before class</Text>
      <TextInput
        accessibilityLabel="Minutes before class"
        keyboardType="number-pad"
        value={minutes}
        editable={!disabled}
        accessibilityState={{ disabled }}
        style={styles.input}
        onChangeText={(value) => {
          edited.current = true;
          setMinutes(value);
          setSaved(false);
        }}
      />
      {validation && (
        <Text accessibilityRole="alert" style={styles.error}>
          {validation}
        </Text>
      )}
      {loading && native && (
        <ActivityIndicator accessibilityLabel="Updating notification settings" />
      )}
      <Button
        title="Save settings"
        disabled={disabled}
        onPress={() => void save()}
      />
      {saved && <Text accessibilityLiveRegion="polite">Settings saved.</Text>}
      <Text>
        Preferences apply to your account. Other devices update when you next
        open or return to SlugNav.
      </Text>
      <Text>
        Reminders repeat weekly, including breaks, until you change your
        schedule or turn them off. Keep your phone on Pacific time for UCSC
        classes. Your phone's notification settings may delay or silence alerts.
      </Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, backgroundColor: "#F6F8F5", flexGrow: 1 },
  title: { fontSize: 22, fontWeight: "700", color: "#174B35" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#819487",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  error: { color: "#A12828" },
});
