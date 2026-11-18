interface ParsedLocation {
  type: string;
  place: string;
}

export default function parsePisaLocations(location: string): ParsedLocation {
  // replace double spaces
  location = location.replace(/\s{2,}/g, " ").trim();

  if (!location || location === "Unknown Location") {
    return {
      type: "Unknown",
      place: "Unknown",
    };
  }

  const parse = location.match(/^([a-zA-Z]+):\s*(.*)$/);
  if (!parse) {
    return {
      type: "Unknown",
      place: location,
    };
  }

  let type = parse[1]!.toLowerCase();
  if (type.includes("lec")) type = "Lecture";
  else if (type.includes("dis")) type = "Discussion";
  else if (type.includes("lab")) type = "Lab";
  else if (type.includes("sem")) type = "Seminar";
  else if (type.includes("ind")) type = "Independent";
  else if (type.includes("fld")) type = "Field of Study";
  else if (type.includes("stu")) type = "Directed Student Teaching";
  else if (type.includes("prac")) type = "Practice";
  else type = "Unknown";

  return {
    type,
    place: parse[2]?.trim() || "Unknown",
  };
}
