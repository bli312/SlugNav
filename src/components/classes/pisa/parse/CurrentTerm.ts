import axios from "axios";
import * as cheerio from "cheerio";

import { ENDPOINT, TERM_DROPDOWN } from "../PisaElements";

export default async function getCurrentTerm(): Promise<number> {
  const res = await axios.get(ENDPOINT);
  if (res.status != 200)
    throw new Error(`[ERROR] Could not get current term, status ${res.status}`);

  const $ = cheerio.load(res.data);
  const term = $(`#${TERM_DROPDOWN} option`).attr("value") || "-1";
  if (term === "-1")
    throw new Error(
      "Could not get current term; term dropdown not found in PISA HTML",
    );

  // summer quarter is added around the same time as
  // spring quarter, so make sure it does not conflict!
  const isSummer: boolean =
    new Date().getMonth() > 4 ||
    (new Date().getMonth() === 4 && new Date().getDate() > 15);
  return parseInt(term) - (term.endsWith("4") && isSummer ? 2 : 0);
}
