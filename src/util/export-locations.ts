import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import express from "express";
import open from "open";

import Locations from "@/components/places/data/Locations";
import { saveLocations } from "@/components/places/data/SaveLocations";
import { getSupabase } from "@/lib/backend-supabase";

const PORT = 3000;

const app = express();
app.use(express.json());

async function exportLocations() {
  const duplicates = Locations.map((location) => location.name).filter(
    (name, index, names) => names.indexOf(name) !== index,
  );
  if (!duplicates.length)
    console.log("[NOTICE] Duplicate locations:", [...new Set(duplicates)]);
  const { formattedLocations, data, error } = await saveLocations(
    getSupabase(),
    Locations,
  );
  return { formattedLocations, data, error };
}

app.get("/api/locations", async (_, res) => {
  try {
    const { formattedLocations, data, error } = await exportLocations();
    if (error) {
      console.error("[ERROR] Failed to export locations:", error);
      return res.status(500).json({ formattedLocations, data, error });
    }
    console.log("[SUCCESS] Successfully exported to Supabase!");
    return res.json({ formattedLocations, data, error: null });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const supabaseError = error as {
        message?: string;
        code?: string;
        details?: string;
        hint?: string;
      };
      return res.status(500).json({
        error: supabaseError.message,
        code: supabaseError.code,
        details: supabaseError.details,
        hint: supabaseError.hint,
      });
    }
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.listen(PORT, "127.0.0.1", async () => {
  await open(`http://localhost:${PORT}/api/locations`);
  console.log(`[SYSTEM] Proxy server running on port ${PORT}`);
});
