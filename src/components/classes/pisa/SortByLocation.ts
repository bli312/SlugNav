import parsePisaLocations from "./ParsePisaLocations";
import { PisaClass } from "./PisaElements";

export const UNKNOWN = "Unknown Location";

const sortByLocation = (classes: PisaClass[]) => {
  const groupedClasses = classes.reduce(
    (acc, classItem) => {
      const location = classItem.meetingInfo.location || UNKNOWN;
      const parsed = parsePisaLocations(location);
      if (!acc[parsed.place]) {
        acc[parsed.place] = [];
      }
      acc[parsed.place].push(classItem);
      return acc;
    },
    {} as Record<string, PisaClass[]>,
  );

  // sort classes alphabetically
  return Object.fromEntries(
    Object.entries(groupedClasses).sort(([a], [b]) => a.localeCompare(b)),
  );
};

export default sortByLocation;
