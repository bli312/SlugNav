// ====================================================================== //
// =                                                                    = //
// =   IMPORTANT - run with `npx tsx ./src/util/pisa/pisa-scraper.ts`   = //
// =       GO TO http://localhost:3000/api/classes TO SEE RESULTS       = //
// =                                                                    = //
// ====================================================================== //

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import axios from "axios";
import * as cheerio from "cheerio";
import express from "express";
import open from "open";

import getCurrentTerm from "@/components/classes/pisa/CurrentTerm";
import { savePisaClasses } from "@/components/classes/pisa/SavePisaClasses";
import scrapeClass from "@/components/classes/pisa/ScrapePisaClass";
import sortByLocation from "@/components/classes/pisa/SortByLocation";
import { ENDPOINT } from "@/components/classes/pisa/PisaElements";

import { getSupabase } from "../../lib/backend-supabase";

const PORT = 3000;
const DEFAULT_TERM = 2268;

const app = express();
app.use(express.json());
app.get("/api/classes", async (req, res) => {
  try {
    let currentTerm = DEFAULT_TERM;
    try {
      currentTerm = await getCurrentTerm();
    } catch (err) {
      console.warn(
        `[WARNING] Failed to scrape current term, defaulting to ${DEFAULT_TERM}:`,
        err,
      );
    }
    const pisaResponse = await axios.post(
      ENDPOINT,
      {
        action: "results",
        "binds[:term]": currentTerm,
        "binds[:subject]": "",
        "binds[:title]": "",
        "binds[:instructor]": "",
        "binds[:days]": "",
        "binds[:times]": "",
        rec_start: "0",
        rec_dur: "2000",
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows 11; Android 16)",
          Referer: "https://pisa.ucsc.edu/class_search/",
        },
      },
    );
    const $ = cheerio.load(pisaResponse.data);
    const classes = $(".panel.panel-default.row")
      .map((_, element) => scrapeClass($, element))
      .toArray();
    const classesByLocation = sortByLocation(classes);

    const { formattedClasses, data, error } = await savePisaClasses(
      getSupabase(),
      classes,
      currentTerm,
    );

    if (error) {
      console.log(`[SUPABASE ERROR] ${error}`);
      return res.status(500).json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }
    console.log("[SUCCESS] Sucessfully exported to Supabase!");
    return res.json({
      classes: classes,
      formattedClasses: formattedClasses,
      classesByLocation: classesByLocation,
      data: data,
    });
  } catch (error) {
    console.error(
      `[ERROR] ${axios.isAxiosError(error) ? error.response! : error}`,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, "127.0.0.1", async () => {
  await open(`http://localhost:3000/api/classes`);
  console.log(`[SYSTEM] Proxy server running on port ${PORT}`);
});
