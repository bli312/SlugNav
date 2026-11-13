import { PisaClass } from "./PisaElements";
import parsePisaLocations from "./parse/ParsePisaLocations";
import Locations from "@/components/places/data/Locations";

const IGNORE_LIST: string[] = [
  "LEC",
  "DIS",
  "LAB",
  "SEM",
  "IND",
  "FLD",
  "STU",
  "PRAC",
  "TBD In Person",
  "Remote Instruction",
  "Online",
  "Unknown",
];

const groupClassesByLocation = (classes: PisaClass[]) => {
  return classes.reduce<Record<string, PisaClass[]>>((groups, pisaClass) => {
    const name = parsePisaLocations(pisaClass.meetingInfo.location).place;
    (groups[name] ??= []).push(pisaClass);
    return groups;
  }, {});
};

const sortMissingClasses = (classes: PisaClass[]) => {
  const found = classes.filter((pisaClass) => {
    const place = parsePisaLocations(
      pisaClass.meetingInfo.location,
    ).place.toLowerCase();
    return Locations.some((location) =>
      location.pisaName?.toLowerCase().includes(place),
    );
  });
  const ignore = classes.filter((pisaClass) => {
    const place = parsePisaLocations(
      pisaClass.meetingInfo.location,
    ).place.toLowerCase();
    return IGNORE_LIST.find(
      (ignoreItem) => place === ignoreItem.toLowerCase() || place === null,
    );
  });
  const missing = classes.filter(
    (pisaClass) => !found.includes(pisaClass) && !ignore.includes(pisaClass),
  );
  return {
    found: groupClassesByLocation(found),
    ignore: groupClassesByLocation(ignore),
    missing: groupClassesByLocation(missing),
  };
};

export default sortMissingClasses;
