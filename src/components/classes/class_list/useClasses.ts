import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  createManualClass,
  getClasses,
  removeClass,
  saveClass,
} from "./GetClasses";
import type { ManualClassDraft, Class } from "./types.ts";

export default function useClasses(userId: string) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const updating = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
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
  }

  return { classes, loading, error, pendingId, updateClass, addManualClass };
}
