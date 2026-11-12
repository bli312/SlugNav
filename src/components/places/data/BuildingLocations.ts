export interface Building {
  name: string;
  latitude: number;
  longitude: number;
}

export function findBuildingByName(name: string): Building | undefined {
  return Buildings.find((building) => building.name === name);
}

function createBuilding(
  name: string,
  latitude: number,
  longitude: number,
): Building {
  return {
    name: name,
    latitude: latitude,
    longitude: longitude,
  };
}

const Buildings: Building[] = [
  createBuilding(
    "Athletics and Recreation East Field House Complex",
    36.99506737571282,
    -122.05407865669576,
  ),
  createBuilding(
    "Biomedical Sciences Building",
    36.9998207435565,
    -122.06102592225658,
  ),
  createBuilding(
    "Classroom Unit Building",
    36.99808087663596,
    -122.05661578752817,
  ),
  createBuilding(
    "Coastal Biology Building",
    36.95308410931421,
    -122.06519632093466,
  ),
  createBuilding(
    "Communications Building",
    37.00092341882857,
    -122.06150031821896,
  ),
  createBuilding("Cowell Adademics", 36.9973504965229, -122.05381364695707),
  createBuilding("Cowell Classroom", 36.9973504965229, -122.05381364695707),
  createBuilding("Cowell Press", 36.99587534432218, -122.05486060341504),
  createBuilding("Crown Classroom", 37.00010258799506, -122.05475584520123),
  createBuilding(
    "Digital Arts and New Media",
    36.99390854123751,
    -122.0607254543917,
  ),
  createBuilding(
    "Earth and Marine Sciences Building",
    36.99811412731436,
    -122.05957682985539,
  ),
  createBuilding("East Field", 36.99447156218643, -122.05375119762682),
  createBuilding("East Gym", 36.993640244273784, -122.05467020493651),
  createBuilding(
    "Elena Baskin Visual Arts Center",
    36.99456170770014,
    -122.06100828166787,
  ),
  createBuilding("Engineering 2", 37.000977159018404, -122.06286266934484),
  createBuilding("Harbor", 36.96402855953381, -122.00025481636563),
  createBuilding(
    "Humanities and Social Sciences",
    37.0016110372888,
    -122.0552193970828,
  ),
  createBuilding("Humanities 1", 36.9981499615289, -122.05448858843953),
  createBuilding(
    "Humanities Lecture Hall",
    36.99846948382388,
    -122.0544624586917,
  ),
  createBuilding(
    "Interdisciplinary Sciences Building",
    36.998618835093126,
    -122.05979461007455,
  ),
  createBuilding(
    "Jack Baskin Engineering Auditorium",
    37.0002002140186,
    -122.06234955961028,
  ),
  createBuilding(
    "Jack Baskin Engineering",
    37.00038313198104,
    -122.06319382309817,
  ),
  createBuilding(
    "Kresge Academic Building",
    36.99888949684788,
    -122.06608802748495,
  ),
];

export default Buildings;
