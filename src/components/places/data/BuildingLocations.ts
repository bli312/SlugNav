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
  createBuilding("McHenry Library", 36.995736241828155, -122.05896221217482),
  createBuilding(
    "Theater Arts M Media Theater",
    36.995162213463686,
    -122.06163772054488,
  ),
  createBuilding(
    "Merrill Academic Building",
    36.999622864473665,
    -122.05355116690951,
  ),
  createBuilding("Music Classrooms", 36.993419595131215, -122.05998253365406),
  createBuilding(
    "Natural Science 2 Annex",
    36.99852041971845,
    -122.06111651644305,
  ),
  createBuilding(
    "Natural Science Building 2",
    36.99846693076542,
    -122.06038490797435,
  ),
  createBuilding(
    "Oakes Academic Building",
    36.98967399397035,
    -122.06279480157903,
  ),
  createBuilding(
    "Ocean Health Building",
    36.949755549616555,
    -122.06559865922495,
  ),
  createBuilding(
    "UCSC Athletics & Recreation Slug Shed",
    36.993873155943525,
    -122.0544233140016,
  ),
  createBuilding(
    "Physical Sciences Building",
    36.99968476812773,
    -122.06182197565835,
  ),
  createBuilding(
    "Porter Academic Building",
    36.99403273099864,
    -122.06526157902647,
  ),
  createBuilding(
    "Rachel Carson Academic Building",
    36.99192070519859,
    -122.06496466926879,
  ),
  createBuilding(
    "Silicon Valley Campus",
    37.37982333412776,
    -121.97706641189943,
  ),
  createBuilding(
    "Silicon Valley Extension",
    37.37981890962501,
    -121.97698705229239,
  ),
  createBuilding("Sinsheimer Labs", 36.99877474756137, -122.06162924030511),
  createBuilding(
    "Social Sciences 1 Building",
    37.00239258532575,
    -122.0580578484773,
  ),
  createBuilding(
    "Social Sciences 2 Building",
    37.00154106115558,
    -122.05875365021731,
  ),
  createBuilding(
    "Stevenson Academic Building",
    36.99717580982575,
    -122.05167423314813,
  ),
  createBuilding(
    "Wagstaff Stevenson Fireside Lounge",
    36.99692518304219,
    -122.05169582189589,
  ),
  createBuilding(
    "Adlai E. Stevenson Library",
    36.99714178473625,
    -122.05141933550773,
  ),
  createBuilding("Theater Arts Center", 36.99484413399594, -122.06217460965884),
  createBuilding(
    "Theater Arts B Drama",
    36.99501080421445,
    -122.06269508246287,
  ),
  createBuilding(
    "Theater Arts E Classroom",
    36.995083834434176,
    -122.06186488853207,
  ),
  createBuilding(
    "Theater Arts A Mainstage",
    36.99475952356935,
    -122.0625247263977,
  ),
  createBuilding(
    "Theater Arts J Offices",
    36.99439331949685,
    -122.06201037734922,
  ),
  createBuilding(
    "Theater Arts C Studio",
    36.99505394238237,
    -122.06183187564574,
  ),
  createBuilding(
    "Thimann Lecture Hall",
    36.99809224316109,
    -122.06121673907214,
  ),
  createBuilding(
    "Thimann Laboratories",
    36.99814371625425,
    -122.06206109077071,
  ),
  createBuilding("Tennis Courts", 36.99253452842492, -122.0653546178659),
];

export default Buildings;
