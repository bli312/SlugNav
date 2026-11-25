import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  AppState,
  Button,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/providers/auth-provider";
import { getSupabase } from "@/lib/supabase";
import {
  readReminderSettings,
  writeReminderSettings,
  validateReminderSettings,
  type ReminderSettings,
} from "@/lib/reminder-settings";
import {
  buildWeeklyReminders,
  getReminderClasses,
} from "@/lib/class-reminders";
import {
  notificationPermission,
  prepareNotifications,
} from "@/lib/notifications";
import {
  clearOtherAccountReminders,
  syncWeeklyReminders,
} from "@/lib/weekly-notifications";

type Reminders = {
  settings: ReminderSettings | null;
  loading: boolean;
  canSave: boolean;
  error: string | null;
  refresh: () => Promise<boolean>;
  saveSettings: (settings: ReminderSettings) => Promise<boolean>;
};
const ReminderContext = createContext<Reminders | null>(null);

export function ReminderProvider({ children }: PropsWithChildren) {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const identity = useRef(userId);
  identity.current = userId;
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [canSave, setCanSave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);
  const lastRequest = useRef(0);
  const mounted = useRef(true);
  const work = useRef<Promise<unknown>>(Promise.resolve());

  const run = useCallback(
    (draft?: ReminderSettings): Promise<boolean> => {
      if (
        Platform.OS === "web" ||
        authLoading ||
        !mounted.current ||
        userId !== identity.current
      )
        return Promise.resolve(false);
      // A foreground event from closing the permission dialog must not cancel Save.
      const operation = draft ? ++version.current : version.current;
      const request = ++lastRequest.current;
      const current = () =>
        mounted.current &&
        operation === version.current &&
        userId === identity.current;
      setLoading(true);
      setError(null);
      // Keep writes and subsequent reads ordered; stale account results cannot affect UI or rules.
      const result = work.current.then(async () => {
        if (!current()) return false;
        let failure = "Could not load notification settings.";
        try {
          if (!userId) {
            await clearOtherAccountReminders(null);
            return true;
          }
          const client = getSupabase();
          let next: ReminderSettings;
          let permissionAllowed = false;
          if (draft) {
            failure = "Could not save notification settings. Please try again.";
            validateReminderSettings(draft);
            if (draft.enabled) {
              await prepareNotifications();
              if (!current()) return false;
              permissionAllowed = await notificationPermission(true);
              if (!current()) return false;
              if (!permissionAllowed) {
                setError(
                  "Allow notifications in your phone's settings, then save again.",
                );
                return false;
              }
            }
            await writeReminderSettings(client, userId, draft);
            next = draft;
          } else {
            next = await readReminderSettings(client, userId);
          }
          if (!current()) return false;
          setSettings(next);
          setCanSave(true);
          failure = draft
            ? "Settings saved, but reminders could not be updated. Please retry."
            : "Could not update class reminders. Please retry.";
          if (!next.enabled) {
            await syncWeeklyReminders([]);
          } else {
            permissionAllowed =
              permissionAllowed || (await notificationPermission(false));
            if (!current()) return false;
            if (!permissionAllowed) {
              await syncWeeklyReminders([]);
              if (current())
                setError(
                  "Notifications are blocked in your phone's settings. Allow them, then retry.",
                );
              return false;
            }
            const classes = await getReminderClasses(client, userId);
            if (!current()) return false;
            await syncWeeklyReminders(
              buildWeeklyReminders(classes, next.minutesBefore, userId),
            );
          }
          return current();
        } catch {
          if (current()) {
            if (failure === "Could not load notification settings.")
              setCanSave(false);
            setError(failure);
          }
          return false;
        } finally {
          if (current() && request === lastRequest.current) setLoading(false);
        }
      });
      work.current = result;
      return result;
    },
    [userId, authLoading],
  );

  const refresh = useCallback(() => run(), [run]);
  const saveSettings = useCallback(
    (draft: ReminderSettings) => {
      if (!canSave || !userId) return Promise.resolve(false);
      return run(draft);
    },
    [canSave, userId, run],
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      version.current++;
    };
  }, []);

  useEffect(() => {
    version.current++;
    setSettings(null);
    setCanSave(false);
    if (Platform.OS === "web") {
      setLoading(false);
      return;
    }
    if (authLoading) return;
    // Cleanup is independent of database requests, including a stalled request for an old account.
    void clearOtherAccountReminders(userId).catch(() => {
      if (mounted.current && identity.current === userId)
        setError("Could not clear previous class reminders. Please retry.");
    });
    void refresh();
  }, [userId, authLoading, refresh]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return (
    <ReminderContext.Provider
      value={{ settings, loading, canSave, error, refresh, saveSettings }}
    >
      <View style={styles.container}>
        {error && (
          <View style={styles.banner}>
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
            <Button
              title="Retry"
              disabled={loading}
              onPress={() => void refresh()}
            />
          </View>
        )}
        {children}
      </View>
    </ReminderContext.Provider>
  );
}

export function useReminders(): Reminders {
  const context = useContext(ReminderContext);
  if (!context)
    throw new Error("useReminders must be used inside ReminderProvider.");
  return context;
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: { padding: 16, backgroundColor: "#FFF3E6" },
  error: { color: "#A12828" },
});
