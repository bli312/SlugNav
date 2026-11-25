import axios from "axios";
import * as cheerio from "cheerio";

import getCurrentTerm from "@/components/classes/pisa/parse/CurrentTerm";
import scrapeClass from "@/components/classes/pisa/ScrapePisaClass";
import { ENDPOINT } from "@/components/classes/pisa/PisaElements";

const DEFAULT_TERM = 2268;

export async function scrapePisaClasses() {
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
  return {
    classes,
    currentTerm,
  };
}
