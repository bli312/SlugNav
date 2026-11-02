import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import {
  createManualClass,
  getClasses,
  removeClass,
  saveClass,
} from "./GetClasses";
import ManualClassForm from "./ManualClassForm";
import type { ManualClassDraft, Class } from "./types.ts";

export default function ClassListScreen() {
  const { session } = useAuth();
  return session ? (
    <ClassesForUser key={session.user.id} userId={session.user.id} />
  ) : null;
}

function ClassesForUser({ userId }: { userId: string }) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"schedule" | "catalog">("schedule");
  const [showManual, setShowManual] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const updating = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getClasses(getSupabase());
        if (active) setClasses(result);
      } catch {
        if (active) setError("Could not load classes.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function updateClass(item: Class, remove: boolean) {
    if (updating.current || (!remove && item.saved)) return;
    updating.current = true;
    setPendingId(item.id);
    setError(null);
    try {
      if (remove) await removeClass(getSupabase(), userId, item);
      else await saveClass(getSupabase(), userId, item.id);
      setClasses((current) =>
        remove && item.ownerId === userId
          ? current.filter((entry) => entry.id !== item.id)
          : current.map((entry) =>
              entry.id === item.id ? { ...entry, saved: !remove } : entry,
            ),
      );
    } catch {
      setError(
        `Could not ${remove ? "remove" : "save"} the class. Please try again.`,
      );
    } finally {
      updating.current = false;
      setPendingId(null);
    }
  }

  async function addManualClass(draft: ManualClassDraft) {
    const item = await createManualClass(getSupabase(), draft);
    setClasses((current) => [item, ...current]);
    setError(null);
    setShowManual(false);
    setView("schedule");
  }

  if (showManual) {
    return (
      <ManualClassForm
        onSave={addManualClass}
        onCancel={() => setShowManual(false)}
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          color="#174B35"
          accessibilityLabel="Loading classes"
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      data={classes.filter((item) =>
        view === "schedule" ? item.saved : item.ownerId === null,
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.tabs}>
            {(["schedule", "catalog"] as const).map((tab) => (
              <Pressable
                key={tab}
                accessibilityRole="tab"
                accessibilityState={{ selected: view === tab }}
                onPress={() => setView(tab)}
                style={[styles.tab, view === tab && styles.activeTab]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    view === tab && styles.activeTabLabel,
                  ]}
                >
                  {tab === "schedule" ? "My schedule" : "Browse classes"}
                </Text>
              </Pressable>
            ))}
          </View>
          {view === "schedule" && (
            <Button
              title="Add a manual class"
              color="#174B35"
              disabled={pendingId !== null}
              onPress={() => setShowManual(true)}
            />
          )}
          {error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        error ? undefined : (
          <View style={styles.empty}>
            <Text style={styles.message}>
              {view === "schedule"
                ? "No saved classes yet. Browse classes or add your own."
                : "No classes available yet."}
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          {item.courseCode && (
            <Text style={styles.courseCode}>{item.courseCode}</Text>
          )}
          <Text style={styles.title}>{item.title}</Text>
          {item.instructor && (
            <Text style={styles.detail}>{item.instructor}</Text>
          )}
          {item.ownerId && (
            <Text style={styles.detail}>Manual class · Only you</Text>
          )}
          {item.meetings.length ? (
            item.meetings.map((meeting, index) => (
              <View key={index}>
                <Text style={styles.location}>
                  {meeting.location ?? "Location TBA"}
                </Text>
                <Text style={styles.detail}>
                  {[meeting.days, meeting.time].filter(Boolean).join(" · ") ||
                    "Meeting time TBA"}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.detail}>Meeting details TBA</Text>
          )}
          {view === "schedule" ? (
            <>
              {item.ownerId && (
                <Text style={styles.detail}>
                  Removing this class deletes its private details.
                </Text>
              )}
              <Button
                title={pendingId === item.id ? "Removing…" : "Remove"}
                color="#174B35"
                disabled={pendingId !== null}
                onPress={() => void updateClass(item, true)}
              />
            </>
          ) : (
            <Button
              color="#174B35"
              title={
                item.saved
                  ? "Saved"
                  : pendingId === item.id
                    ? "Saving…"
                    : "Save"
              }
              disabled={item.saved || pendingId !== null}
              onPress={() => void updateClass(item, false)}
            />
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F8F5" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#F6F8F5",
  },
  list: {
    padding: 16,
    gap: 12,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  header: { gap: 12, marginBottom: 12 },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#D7DFD8",
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: { borderBottomColor: "#174B35" },
  tabLabel: { fontSize: 15, color: "#526259" },
  activeTabLabel: { fontWeight: "600", color: "#174B35" },
  empty: { gap: 12, paddingVertical: 20 },
  error: { color: "#A12828" },
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  courseCode: { fontSize: 18, fontWeight: "600", color: "#1D2E24" },
  title: { fontSize: 15, marginTop: 2, color: "#1D2E24" },
  location: { fontSize: 15, marginTop: 8, fontWeight: "500", color: "#1D2E24" },
  detail: { fontSize: 14, marginTop: 2, color: "#526259" },
  message: {
    fontSize: 15,
    color: "#526259",
    textAlign: "center",
    lineHeight: 22,
  },
});
