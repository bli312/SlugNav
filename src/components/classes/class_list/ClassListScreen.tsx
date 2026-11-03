import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/providers/auth-provider";
import ClassCard from "./ClassCard";
import ClassListHeader from "./ClassListHeader";
import ManualClassForm from "./ManualClassForm";
import useClasses from "./useClasses";
import type { ClassView } from "./types.ts";
import Searchbar from "../../search/Searchbar";
import { matchesClass } from "./classData";

export default function ClassListScreen() {
  const { session } = useAuth();
  return session ? (
    <ClassesForUser key={session.user.id} userId={session.user.id} />
  ) : null;
}

function ClassesForUser({ userId }: { userId: string }) {
  const { classes, loading, error, pendingId, updateClass, addManualClass } =
    useClasses(userId);
  const [view, setView] = useState<ClassView>("schedule");
  const [showManual, setShowManual] = useState(false);
  const [search, setSearch] = useState("");

  if (showManual) {
    return (
      <ManualClassForm
        onCancel={() => setShowManual(false)}
        onSave={async (draft) => {
          await addManualClass(draft);
          setShowManual(false);
        }}
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
      data={classes.filter(
        (item) =>
          (view === "schedule" ? item.saved : item.ownerId === null) &&
          matchesClass(item, search),
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <ClassListHeader
            view={view}
            onViewChange={setView}
            error={error}
            busy={pendingId !== null}
            onAddManual={() => setShowManual(true)}
          />
          <Searchbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search classes"
          />
        </View>
      }
      ListEmptyComponent={
        error ? undefined : (
          <Text style={styles.empty}>
            {search.trim()
              ? "No matching classes."
              : view === "schedule"
                ? "No saved classes yet. Browse classes or add your own."
                : "No classes available yet."}
          </Text>
        )
      }
      renderItem={({ item }) => (
        <ClassCard
          item={item}
          view={view}
          pendingId={pendingId}
          onPress={() => void updateClass(item, view === "schedule")}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: 8 },
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
  empty: {
    paddingVertical: 20,
    fontSize: 15,
    color: "#526259",
    textAlign: "center",
    lineHeight: 22,
  },
});
