// ============================================================================ //
// =                                                                          = //
// =   IMPORTANT - run with `npx tsx ./src/util/pisa/pisa-scraper-export.ts`  = //
// =          GO TO http://localhost:3000/api/classes TO SEE RESULTS          = //
// =                                                                          = //
// ============================================================================ //

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import axios from "axios";
import express from "express";
import open from "open";

import { scrapePisaClasses } from "./scrapePisaClasses";
import { exportPisaClasses } from "./exportPisaClasses";

const PORT = 3000;

const app = express();
app.use(express.json());

app.get("/api/classes", async (_, res) => {
  try {
    const { classes, currentTerm } = await scrapePisaClasses();
    const { formattedClasses, classesByLocation, missingClasses, data } =
      await exportPisaClasses(classes, currentTerm);
    return res.json({
      classes,
      formattedClasses,
      classesByLocation,
      missingClasses,
      data,
    });
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
    console.error(
      `[ERROR] ${axios.isAxiosError(error) ? error.response : error}`,
    );
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.listen(PORT, "127.0.0.1", async () => {
  await open(`http://localhost:${PORT}/api/classes`);
  console.log(`[SYSTEM] Proxy server running on port ${PORT}`);
});
