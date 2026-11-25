// ============================================================================ //
// =                                                                          = //
// =   IMPORTANT - run with `npx tsx ./src/util/pisa/pisa-scraper-local.ts`   = //
// =          GO TO http://localhost:3000/api/classes TO SEE RESULTS          = //
// =                                                                          = //
// ============================================================================ //

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import axios from "axios";
import express from "express";
import open from "open";

import { scrapePisaClasses } from "./scrapePisaClasses";
import sortByLocation from "@/components/classes/pisa/SortByLocation";
import sortMissingClasses, {
  locationsWithRooms,
} from "@/components/classes/pisa/SortMissingClasses";
import { parsePisaMeetings } from "@/components/classes/pisa/parse/ParsePisaMeetings";

const PORT = 3000;

const app = express();
app.use(express.json());

app.get("/api/classes", async (_, res) => {
  try {
    const classes = (await scrapePisaClasses()).classes;
    const formattedClasses = classes.map((item) => ({
      code: item.code,
      name: item.name,
      class_number: item.number,
      location: item.meetingInfo.location,
      day_and_time: item.meetingInfo.dayAndTime,
      instructor_name: item.instructor.name,
      meetings: parsePisaMeetings(
        item.meetingInfo.dayAndTime,
        item.meetingInfo.location,
      ),
    }));
    const classesByLocation = sortByLocation(classes);
    const missingClasses = sortMissingClasses(classes);
    console.log(`
      ##################################################
      #                                                #
      #   [SUCCESS] Successfully scraped and opened!   #
      #                                                #
      ##################################################

        DESCRIPTION                  |  # OF CLASSES
      -------------------------------|------------------
      Classes with Known Buildings:  |  ${Object.values(missingClasses.found).flat().length}
      Classes with Known Rooms:      |  ${locationsWithRooms(Object.values(missingClasses.found).flat())}
      Ignored Classes:               |  ${Object.values(missingClasses.ignore).flat().length}
      Missing Classes:               |  ${Object.values(missingClasses.missing).flat().length}
      -------------------------------|------------------
      Total Classes Scraped:         |  ${formattedClasses.length}
    `);
    return res.json({
      classes,
      formattedClasses,
      classesByLocation,
      missingClasses,
    });
  } catch (error: unknown) {
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
