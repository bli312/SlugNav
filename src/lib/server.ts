import { ENDPOINT, PartialClass } from "@/components/classes/pisa/PisaElements";
import axios from "axios";
import * as cheerio from "cheerio";
import { AnyNode, Element } from "domhandler";
import express from "express";

const app = express();
app.use(express.json());

const DEFAULT_TERM = 2268;

app.get("/api/classes", async (req, res) => {
  try {
    const pisaResponse = await axios.post(
      ENDPOINT,
      {
        action: "results",
        "binds[:term]": DEFAULT_TERM,
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
    function scrapeClass(
      _: unknown,
      el: cheerio.BasicAcceptedElems<AnyNode>,
    ): PartialClass {
      const find = (
        selector: string | Element | cheerio.Cheerio<Element> | undefined,
      ) => $(el).find(selector);

      const [code, name] = find("h2 a")
        .text()
        .split(/\u00A0\u00A0\u00A0/g)
        .map((s) => s.trim());

      const location = find(
        ".panel-body .row > div:nth-child(3) > div:nth-child(1)",
      )
        .text()
        .replace("Location:", "")
        .trim();

      const dayAndTime = find(
        ".panel-body .row > div:nth-child(3) > div:nth-child(2)",
      )
        .text()
        .replace("Day and Time:", "")
        .trim();

      return {
        code,
        name,
        number: parseInt(
          find(".panel-body .row > div:nth-child(1) a").text().trim(),
        ),
        meetingInfo: {
          location,
          dayAndTime,
        },
        instructor: {
          name: find(".panel-body .row > div:nth-child(2)")
            .text()
            .split(":")[1]
            .trim(),
        },
      };
    }
    const classes = $(".panel.panel-default.row").map(scrapeClass).toArray();
    console.log(classes);
    return res.json(classes);
  } catch (error) {
    console.error(axios.isAxiosError(error) ? error.response! : error);
  }
});

app.listen(3000, () => console.log("Proxy server running on port 3000"));
