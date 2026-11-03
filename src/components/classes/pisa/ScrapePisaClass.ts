import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import type { PisaClass } from "./PisaElements.ts";

export default function scrapeClass(
  $: cheerio.CheerioAPI,
  element: cheerio.BasicAcceptedElems<AnyNode>,
): PisaClass {
  const find = (
    selector: string | Element | cheerio.Cheerio<Element> | undefined,
  ) => $(element).find(selector);
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
  const schedule = find(
    ".panel-body .row > div:nth-child(3) > div:nth-child(2)",
  ).clone();
  schedule.find("br").replaceWith("\n");
  const dayAndTime = schedule.text().replace("Day and Time:", "").trim();
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
