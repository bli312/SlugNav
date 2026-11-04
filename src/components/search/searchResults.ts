import type { Class } from "../classes/class_list/types.ts";
import { matchesClass } from "../classes/class_list/classData.ts";
import { placeTypes, type Place } from "../places/places.ts";

export const searchCategories = {
  classes: "Classes",
  classroom: "Classrooms",
  water_fountain: "Water fountains",
  bathroom: "Bathrooms",
} as const;
export type SearchCategory = keyof typeof searchCategories;
export type SearchResult = {
  key: string;
  title: string;
  detail: string;
  place?: Place;
};

export function searchResults(
  classes: Class[],
  places: Place[],
  search: string,
  categories: SearchCategory[],
): SearchResult[] {
  const query = search.trim().toLowerCase();
  if (!query) return [];
  const classResults = categories.includes("classes")
    ? classes
        .filter((item) => matchesClass(item, query))
        .map((item) => ({
          key: `class:${item.id}`,
          title: [item.courseCode, item.title].filter(Boolean).join(" · "),
          detail:
            [
              item.instructor,
              ...item.meetings.map((meeting) =>
                [meeting.location ?? "Location TBA", meeting.days, meeting.time]
                  .filter(Boolean)
                  .join(" · "),
              ),
            ]
              .filter(Boolean)
              .join("\n") || "Meeting details TBA",
        }))
    : [];
  const placeResults = places
    .filter(
      (place) =>
        categories.includes(place.type) &&
        `${place.name} ${placeTypes[place.type]}`.toLowerCase().includes(query),
    )
    .map((place) => ({
      key: `place:${place.id}`,
      title: place.name,
      detail: placeTypes[place.type],
      place,
    }));
  return [...classResults, ...placeResults];
}
