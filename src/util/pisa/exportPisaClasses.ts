import { savePisaClasses } from "@/components/classes/pisa/SavePisaClasses";
import sortByLocation from "@/components/classes/pisa/SortByLocation";

import { getSupabase } from "../../lib/backend-supabase";

export async function exportPisaClasses(
  classes: Awaited<
    ReturnType<typeof import("./scrapePisaClasses").scrapePisaClasses>
  >["classes"],
  currentTerm: number,
) {
  const classesByLocation = sortByLocation(classes);
  const { formattedClasses, data, error } = await savePisaClasses(
    getSupabase(),
    classes,
    currentTerm,
  );
  if (error) {
    console.error(`[SUPABASE ERROR] ${error}`);
    throw error;
  }
  console.log("[SUCCESS] Successfully exported to Supabase!");
  return {
    formattedClasses,
    classesByLocation,
    data,
  };
}
