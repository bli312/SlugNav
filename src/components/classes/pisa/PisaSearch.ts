import * as cheerio from "cheerio";
import { ENDPOINT, PartialClass } from "./PisaElements";
import { AxiosResponse } from "axios";
import { POST } from "./SearchRequests";
import { AnyNode, Element } from "domhandler";

const DEFAULT_TERM = 2268;

interface SearchOptions {
  term?: number;
}

export default async function search(
  options?: SearchOptions,
): Promise<Array<PartialClass>> {
  const siteData = {
    action: "results",
    "binds[:term]": options?.term || DEFAULT_TERM,
    "binds[:subject]": "",
    "binds[:title]": "",
    "binds[:instructor]": "",
    "binds[:days]": "",
    "binds[:times]": "",
  };

  const res: AxiosResponse = await POST(ENDPOINT, siteData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://pisa.ucsc.edu/class_search/",
    },
    timeout: 60000,
  });
  if (res.status != 200) {
    throw new Error(`[ERROR] POST failed, status ${res.status}`);
  }

  const $ = cheerio.load(res.data);
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

  return $(".panel.panel-default.row").map(scrapeClass).toArray();
}
