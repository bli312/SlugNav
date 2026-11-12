import { Building, findBuildingByName } from "./BuildingLocations";
import Rooms, { Room } from "./RoomLocations";

interface Location {
  name: string;
  pisaName: string;
  building: Building | undefined;
  room: Room | undefined;
}

function findLocation(
  buildingName: string,
  roomName?: string,
): Pick<Location, "building" | "room"> {
  const building = findBuildingByName(buildingName);

  const room = roomName
    ? Rooms.find((room) => room.building === building && room.name === roomName)
    : undefined;

  return { building, room };
}

function createLocation(
  name: string,
  pisaName: string,
  buildingName: string,
  roomName?: string,
): Location {
  return {
    name,
    pisaName,
    ...findLocation(buildingName, roomName),
  };
}

const Locations: Location[] = [
  createLocation(
    "50 Meter Pool",
    "50 Mtr Pool",
    "Athletics and Recreation East Field House Complex",
    "50 Meter Pool",
  ),
  createLocation(
    "Biomedical Sciences Room 200",
    "BiomedSci 200",
    "Biomedical Sciences Building",
    "200",
  ),
  createLocation(
    "Biomedical Sciences Room 300",
    "BiomedSci 300",
    "Biomedical Sciences Building",
    "300",
  ),
  createLocation(
    "Classroom Unit 001",
    "ClassroomUnit 001",
    "Classroom Unit Building",
    "001",
  ),
  createLocation(
    "Classroom Unit 002",
    "ClassroomUnit 002",
    "Classroom Unit Building",
    "002",
  ),
  createLocation(
    "Coastal Biology Room 110",
    "CoastBio 110",
    "Coastal Biology Building",
    "110",
  ),
  createLocation(
    "Coastal Biology Room 115",
    "CoastBio 115",
    "Coastal Biology Building",
    "115",
  ),
  createLocation(
    "Coastal Biology Room 203",
    "CoastBio 203",
    "Coastal Biology Building",
    "203",
  ),
  createLocation(
    "Communications Building Room 011",
    "Commun Bldg 011",
    "Communications Building",
    "011",
  ),
  createLocation(
    "Communications Building Room 113",
    "Commun Bldg 113",
    "Communications Building",
    "113",
  ),
  createLocation(
    "Communications Building Room 117",
    "Commun Bldg 117",
    "Communications Building",
    "117",
  ),
  createLocation(
    "Communications Building Room 121",
    "Commun Bldg 121",
    "Communications Building",
    "121",
  ),
  createLocation(
    "Communications Building Room 130",
    "Commun Bldg 130",
    "Communications Building",
    "130",
  ),
  createLocation(
    "Communications Building Room 139",
    "Commun Bldg 139",
    "Communications Building",
    "139",
  ),
  createLocation(
    "Communications Building Room 150",
    "Commun Bldg 150",
    "Communications Building",
    "150",
  ),
  createLocation(
    "Cowell Academics Room 113",
    "Cowell Acad 113",
    "Cowell Academics",
    "113",
  ),
  createLocation(
    "Cowell Academics Room 216",
    "Cowell Acad 216",
    "Cowell Academics",
    "216",
  ),
  createLocation(
    "Cowell Academics Room 222",
    "Cowell Acad 222",
    "Cowell Academics",
    "222",
  ),
  createLocation(
    "Cowell Academics Room 223",
    "Cowell Acad 223",
    "Cowell Academics",
    "223",
  ),
  createLocation(
    "Cowell Classroom 131",
    "Cowell Clrm 131",
    "Cowell Classroom",
    "131",
  ),
  createLocation(
    "Cowell College 134",
    "Cowell Com 134",
    "Cowell Academics",
    "134",
  ),
  createLocation(
    "Cowell College 239",
    "Cowell Com 239",
    "Cowell Classroom",
    "239",
  ),
  createLocation(
    "Cowell Press Room 123",
    "Cowell Press 123",
    "Cowell Classroom",
    "123",
  ),
  createLocation(
    "Crown Classroom 104",
    "Crown Clrm 104",
    "Crown Classroom",
    "104",
  ),
  createLocation(
    "Crown Classroom 105",
    "Crown Clrm 105",
    "Crown Classroom",
    "105",
  ),
  createLocation(
    "Crown Classroom 201",
    "Crown Clrm 201",
    "Crown Classroom",
    "201",
  ),
  createLocation(
    "Crown Classroom 202",
    "Crown Clrm 202",
    "Crown Classroom",
    "202",
  ),
  createLocation(
    "Crown Classroom 203",
    "Crown Clrm 203",
    "Crown Classroom",
    "203",
  ),
  createLocation(
    "Crown Classroom 208",
    "Crown Clrm 208",
    "Crown Classroom",
    "208",
  ),
  createLocation(
    "Digital Arts Room 230",
    "Digital Arts 230",
    "Digital Arts and New Media",
    "230",
  ),
  createLocation(
    "Digital Arts Room 243",
    "Digital Arts 243",
    "Digital Arts and New Media",
    "243",
  ),
  createLocation(
    "Digital Arts Room 308",
    "Digital Arts 308",
    "Digital Arts and New Media",
    "308",
  ),
  createLocation(
    "Earth and Marine Room A176",
    "Earth&Marine A176",
    "Earth and Marine Sciences Building",
    "A176",
  ),
  createLocation(
    "Earth and Marine Room B206",
    "Earth&Marine B206",
    "Earth and Marine Sciences Building",
    "B206",
  ),
  createLocation(
    "Earth and Marine Room B210",
    "Earth&Marine B210",
    "Earth and Marine Sciences Building",
    "B210",
  ),
  createLocation(
    "Earth and Marine Room B214",
    "Earth&Marine B214",
    "Earth and Marine Sciences Building",
    "B214",
  ),
  createLocation(
    "Earth and Marine Room B226",
    "Earth&Marine B226",
    "Earth and Marine Sciences Building",
    "B226",
  ),
  createLocation(
    "Earth and Marine Room B236",
    "Earth&Marine B236",
    "Earth and Marine Sciences Building",
    "B236",
  ),
  createLocation(
    "Earth and Marine Room B250",
    "Earth&Marine B250",
    "Earth and Marine Sciences Building",
    "B250",
  ),
  createLocation(
    "Earth and Marine Room B258",
    "Earth&Marine B258",
    "Earth and Marine Sciences Building",
    "B258",
  ),
  createLocation(
    "Earth and Marine Room B266",
    "Earth&Marine B266",
    "Earth and Marine Sciences Building",
    "B266",
  ),
  createLocation("East Field", "East Field", "East Field"),
  createLocation("East Gym", "East Gym", "East Gym"),
  createLocation(
    "Elena Baskin Arts Room E101",
    "Elena Baskin Arts E101",
    "Elena Baskin Visual Arts Center",
    "E101",
  ),
  createLocation(
    "Elena Baskin Arts Room E102",
    "Elena Baskin Arts E102",
    "Elena Baskin Visual Arts Center",
    "E102",
  ),
  createLocation(
    "Elena Baskin Arts Room G101",
    "Elena Baskin Arts G101",
    "Elena Baskin Visual Arts Center",
    "G101",
  ),
  createLocation(
    "Elena Baskin Arts Room J101",
    "Elena Baskin Arts J101",
    "Elena Baskin Visual Arts Center",
    "J101",
  ),
  createLocation(
    "Elena Baskin Arts Room L101",
    "Elena Baskin Arts L101",
    "Elena Baskin Visual Arts Center",
    "L101",
  ),
  createLocation(
    "Elena Baskin Arts Room M101",
    "Elena Baskin Arts M101",
    "Elena Baskin Visual Arts Center",
    "M101",
  ),
  createLocation(
    "Elena Baskin Arts Room P101",
    "Elena Baskin Arts P101",
    "Elena Baskin Visual Arts Center",
    "P101",
  ),
  createLocation(
    "Engineering 2 Room 192",
    "Engineering 2 192",
    "Engineering 2",
    "192",
  ),
  createLocation(
    "Engineering 2 Room 194",
    "Engineering 2 194",
    "Engineering 2",
    "194",
  ),
  createLocation(
    "Engineering 2 Room 499",
    "Engineering 2 499",
    "Engineering 2",
    "499",
  ),
  createLocation(
    "Engineering 2 Room 585",
    "Engineering 2 585",
    "Engineering 2",
    "585",
  ),
  createLocation(
    "Engineering 2 Room 585",
    "Engineering 2 585",
    "Engineering 2",
    "585",
  ),
  createLocation("Harbor", "Harbor", "Harbor"),
  createLocation(
    "Humanities and Social Sciences Room 250",
    "Hum & Soc Sci 250",
    "Humanities and Social Sciences",
    "250",
  ),
  createLocation(
    "Humanities and Social Sciences Room 350",
    "Hum & Soc Sci 350",
    "Humanities and Social Sciences",
    "350",
  ),
  createLocation(
    "Humanities 1 Room 110",
    "Humanities 1 110",
    "Humanities 1",
    "110",
  ),
  createLocation(
    "Humanities 1 Room 300",
    "Humanities 1 300",
    "Humanities 1",
    "300",
  ),
  createLocation(
    "Humanities 1 Room 320",
    "Humanities 1 320",
    "Humanities 1",
    "320",
  ),
  createLocation(
    "Humanities 1 Room 400",
    "Humanities 1 400",
    "Humanities 1",
    "400",
  ),
  createLocation(
    "Humanities 1 Room 545",
    "Humanities 1 545",
    "Humanities 1",
    "545",
  ),
  createLocation(
    "Humanities 1 Room 620",
    "Humanities 1 620",
    "Humanities 1",
    "620",
  ),
  createLocation(
    "Humanities Lecture Hall",
    "Humn Lecture Hall",
    "Humanities Lecture Hall",
  ),
  createLocation(
    "Interdisciplinary Sciences Building Room 165",
    "ISB 165",
    "Interdisciplinary Sciences Building",
    "165",
  ),
  createLocation(
    "Interdisciplinary Sciences Building Room 221",
    "ISB 221",
    "Interdisciplinary Sciences Building",
    "221",
  ),
  createLocation(
    "Interdisciplinary Sciences Building Room 231",
    "ISB 231",
    "Interdisciplinary Sciences Building",
    "231",
  ),
  createLocation(
    "Interdisciplinary Sciences Building Room 413",
    "ISB 413",
    "Interdisciplinary Sciences Building",
    "413",
  ),
  createLocation(
    "Interdisciplinary Sciences Building Room 431",
    "ISB 431",
    "Interdisciplinary Sciences Building",
    "431",
  ),
  createLocation(
    "Interdisciplinary Sciences Building Room 455",
    "ISB 455",
    "Interdisciplinary Sciences Building",
    "455",
  ),
  createLocation(
    "Interdisciplinary Sciences Building Room 486",
    "ISB 486",
    "Interdisciplinary Sciences Building",
    "486",
  ),
  createLocation(
    "Jack Baskin Engineering Auditorium",
    "J Bask Aud 101",
    "Jack Baskin Engineering Auditorium",
  ),
  createLocation(
    "Jack Baskin Engineering Room 097",
    "J Baskin Engr 097",
    "Jack Baskin Engineering",
    "097",
  ),
  createLocation(
    "Jack Baskin Engineering Room 152",
    "J Baskin Engr 152",
    "Jack Baskin Engineering",
    "152",
  ),
  createLocation(
    "Jack Baskin Engineering Room 156",
    "J Baskin Engr 156",
    "Jack Baskin Engineering",
    "156",
  ),
  createLocation(
    "Jack Baskin Engineering Room 165",
    "J Baskin Engr 165",
    "Jack Baskin Engineering",
    "165",
  ),
  createLocation(
    "Jack Baskin Engineering Room 169",
    "J Baskin Engr 169",
    "Jack Baskin Engineering",
    "169",
  ),
  createLocation(
    "Jack Baskin Engineering Room 250",
    "J Baskin Engr 250",
    "Jack Baskin Engineering",
    "250",
  ),
  createLocation(
    "Jack Baskin Engineering Room 372",
    "J Baskin Engr 372",
    "Jack Baskin Engineering",
    "372",
  ),
  createLocation(
    "Kresge Academics Room 1302",
    "Kresge Acad 1302",
    "Kresge Academic Building",
    "1302",
  ),
  createLocation(
    "Kresge Academics Room 2303",
    "Kresge Acad 2303",
    "Kresge Academic Building",
    "2303",
  ),
  createLocation(
    "Kresge Academics Room 3101",
    "Kresge Acad 3101",
    "Kresge Academic Building",
    "3101",
  ),
  createLocation(
    "Kresge Academics Room 3105",
    "Kresge Acad 3105",
    "Kresge Academic Building",
    "3105",
  ),
  createLocation(
    "Kresge Academics Room 3201",
    "Kresge Acad 3201",
    "Kresge Academic Building",
    "3201",
  ),
  createLocation(
    "Kresge Academics Room 3301",
    "Kresge Acad 3301",
    "Kresge Academic Building",
    "3301",
  ),
  createLocation(
    "LG Discovery Room 128",
    "Lg Discovery 128",
    "Seymour Marine Discovery Center",
    "128",
  ),
];

export default Locations;
