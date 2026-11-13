import { PisaClass } from "./PisaElements";
import parsePisaLocations from "./parse/ParsePisaLocations";
import Locations from "@/components/places/data/Locations";

const sortMissingClasses = (classes: PisaClass[]) => {
  const found = classes.filter((pisaClass) => {
    const place = parsePisaLocations(
      pisaClass.meetingInfo.location,
    ).place.toLowerCase();
    return Locations.some((location) =>
      location.pisaName?.toLowerCase().includes(place),
    );
  });
  const missing = classes.filter((pisaClass) => !found.includes(pisaClass));
  return {
    found,
    missing,
  };
};

export default sortMissingClasses;
