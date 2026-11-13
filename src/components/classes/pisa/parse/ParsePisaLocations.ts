interface ParsedLocation {
  type: string;
  place: string;
}

export default function parsePisaLocations(location: string): ParsedLocation {
  if (!location || location === "Unknown Location") {
    return {
      type: "Unknown",
      place: "Unknown",
    };
  }
  const parse = location.split(": ");
  let type = parse[0]!.toLowerCase();

  if (type.includes("lec")) type = "Lecture";
  else if (type.includes("dis")) type = "Discussion";
  else if (type.includes("lab")) type = "Lab";
  else if (type.includes("sem")) type = "Seminar";
  else if (type.includes("fld")) type = "Field of Study";
  else if (type.includes("prac")) type = "Practice";
  else type = "Unknown";

  return {
    type,
    place: parse[1] ?? "Unknown",
  };
}
