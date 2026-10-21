import { mockClasses } from "./mockClasses";
import type { UcscClass } from "./types";

// The screen only calls getClasses(). Switching from mock data to the
// backend (issue #10) means changing only this file.
const USE_MOCK = true;

export async function getClasses(): Promise<UcscClass[]> {
  if (USE_MOCK) {
    return mockClasses;
  }

  // Backend version comes in issue #10.
  return mockClasses;
}
