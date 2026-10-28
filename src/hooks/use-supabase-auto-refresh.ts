import { useEffect } from "react";
import { AppState, Platform } from "react-native";

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/** Mount once in the root layout. Supabase handles browser visibility itself. **/
export function useSupabaseAutoRefresh() {
  useEffect(() => {
    if (Platform.OS === "web" || !isSupabaseConfigured()) return;

    const supabase = getSupabase();
    const updateRefresh = (state: string | null | undefined) => {
      if (state === "active") {
        void supabase.auth.startAutoRefresh();
      } else {
        void supabase.auth.stopAutoRefresh();
      }
    };

    updateRefresh(AppState.currentState);
    const subscription = AppState.addEventListener("change", updateRefresh);

    return () => {
      subscription.remove();
      void supabase.auth.stopAutoRefresh();
    };
  }, []);
}
