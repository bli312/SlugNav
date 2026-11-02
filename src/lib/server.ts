// ================================================================ //
// =                                                              = //
// =      IMPORTANT - run with `npx tsx ./src/lib/server.ts`      = //
// =                                                              = //
// ================================================================ //

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

console.log("Supabase URL loaded:", !!process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log(
  "Backend secret loaded:",
  !!process.env.BACKEND_SUPABASE_SECRET_KEY,
);

import axios from "axios";
import * as cheerio from "cheerio";
import express from "express";

import { ENDPOINT } from "@/components/classes/pisa/PisaElements";
import getCurrentTerm from "@/components/classes/pisa/CurrentTerm";
import scrapeClass from "@/components/classes/pisa/ScrapePisaClass";
import { getSupabase } from "./backend-supabase";

const app = express();
app.use(express.json());

const DEFAULT_TERM = 2268;

app.get("/api/classes", async (req, res) => {
  try {
    let currentTerm = DEFAULT_TERM;
    try {
      currentTerm = await getCurrentTerm();
    } catch (err) {
      console.warn(
        `[WARNING] Failed to fetch current term dynamically, falling back to ${DEFAULT_TERM}:`,
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

    // format then upsert into supabase
    const formattedClasses = classes.map((column) => ({
      code: column.code,
      name: column.name,
      class_number: column.number,
      location: column.meetingInfo.location,
      day_and_time: column.meetingInfo.dayAndTime,
      instructor_name: column.instructor.name,
      term: currentTerm,
    }));
    const { data, error } = await getSupabase()
      .from("classes")
      .upsert(formattedClasses, { onConflict: "class_number" });

    if (error) {
      console.log(`[SUPABASE ERROR] ${error}`);
      return res.status(500).json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }
    return res.json({ classes: classes, data: data });
  } catch (error) {
    console.error(
      `[ERROR] ${axios.isAxiosError(error) ? error.response! : error}`,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3000, () => console.log("Proxy server running on port 3000"));
