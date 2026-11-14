export interface Building {
  name: BuildingName;
  latitude: number;
  longitude: number;
}

export function findBuildingByName(name: BuildingName): Building | undefined {
  return Buildings.find((building) => building.name === name);
}

export enum BuildingName {
  AthleticsRecreation = "Athletics and Recreation East Field House Complex",
  AthleticsRecreationShed = "Athletics and Recreation Slug Shed",
  BiomedicalSci = "Biomedical Sciences Building",
  ClassroomUnit = "Classroom Unit Building",
  CoastalBio = "Coastal Biology Building",
  Communications = "Communications Building",
  CowellAcad = "Cowell Adademics",
  CowellClass = "Cowell Classroom",
  CowellPress = "Cowell Press",
  CrownClass = "Crown Classroom",
  DigitalArts = "Digital Arts and New Media",
  EarthMarines = "Earth and Marine Sciences Building",
  EastField = "East Field",
  EastGym = "East Gym",
  ElenaBaskin = "Elena Baskin Visual Arts Center",
  ElenaBaskinA = "Elena Baskin Visual Arts Building A",
  ElenaBaskinB = "Elena Baskin Visual Arts Building B",
  ElenaBaskinC = "Elena Baskin Visual Arts Building C",
  ElenaBaskinD = "Elena Baskin Visual Arts Building D",
  ElenaBaskinE = "Elena Baskin Visual Arts Building E",
  ElenaBaskinF = "Elena Baskin Visual Arts Building F",
  ElenaBaskinG = "Elena Baskin Visual Arts Building G",
  ElenaBaskinH = "Elena Baskin Visual Arts Building H",
  ElenaBaskinI = "Elena Baskin Visual Arts Building I",
  ElenaBaskinJ = "Elena Baskin Visual Arts Building J",
  ElenaBaskinK = "Elena Baskin Visual Arts Building K",
  ElenaBaskinL = "Elena Baskin Visual Arts Building L",
  ElenaBaskinM = "Elena Baskin Visual Arts Building M",
  ElenaBaskinN = "Elena Baskin Visual Arts Building N",
  ElenaBaskinP = "Elena Baskin Visual Arts Building P",
  Engineering2 = "Engineering 2",
  Harbor = "Harbor",
  HumanitiesSocSci = "Humanities and Social Sciences",
  Humanities1 = "Humanities 1",
  HumanitiesLecture = "Humanities Lecture Hall",
  InterSci = "Interdisciplinary Sciences Building",
  JackBaskin = "Jack Baskin Engineering",
  JackBaskinAudit = "Jack Baskin Engineering Auditorium",
  KresgeAcad = "Kresge Academic Building",
  McHenryLib = "McHenry Library",
  MerrillAcad = "Merrill Academic Building",
  Music = "Music Classrooms",
  NatSci2Annex = "Natural Science 2 Annex",
  NatSci2Main = "Natural Science Main Building 2",
  OakesAcad = "Oakes Academic Building",
  OceanHealth = "Ocean Health Building",
  PhysSci = "Physical Sciences Building",
  PorterAcad = "Porter Academic Building",
  RCAcad = "Rachel Carson Academic Building",
  Seymour = "Seymour Marine Discovery Center",
  Sinsheimer = "Sinsheimer Labs",
  SNELibrary = "Science and Engineering Library",
  SocSci1 = "Social Sciences 1 Building",
  SocSci2 = "Social Sciences 2 Building",
  StevensonAcad = "Stevenson Academic Building",
  StevensonFire = "Wagstaff Stevenson Fireside Lounge",
  SVCampus = "Silicon Valley Campus",
  SVExtension = "Silicon Valley Extension",
  StevensonLib = "Adlai E. Stevenson Library",
  TheaterArts = "Theater Arts Center",
  TheaterArtsA = "Theater Arts A Mainstage",
  TheaterArtsB = "Theater Arts B Drama",
  TheaterArtsC = "Theater Arts C Studio",
  TheaterArtsE = "Theater Arts E Classroom",
  TheaterArtsJ = "Theater Arts J Offices",
  TheaterArtsM = "Theater Arts M Media Theater",
  ThimannLec = "Thimann Lecture Hall",
  ThimannLab = "Thimann Laboratories",
  TennisCourts = "Tennis Courts",
}

function createBuilding(
  name: BuildingName,
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
    BuildingName.AthleticsRecreation,
    36.99506737571282,
    -122.05407865669576,
  ),
  createBuilding(
    BuildingName.BiomedicalSci,
    36.9998207435565,
    -122.06102592225658,
  ),
  createBuilding(
    BuildingName.ClassroomUnit,
    36.99808087663596,
    -122.05661578752817,
  ),
  createBuilding(
    BuildingName.CoastalBio,
    36.95308410931421,
    -122.06519632093466,
  ),
  createBuilding(
    BuildingName.Communications,
    37.00092341882857,
    -122.06150031821896,
  ),
  createBuilding(
    BuildingName.CowellAcad,
    36.9973504965229,
    -122.05381364695707,
  ),
  createBuilding(
    BuildingName.CowellClass,
    36.9973504965229,
    -122.05381364695707,
  ),
  createBuilding(
    BuildingName.CowellPress,
    36.99587534432218,
    -122.05486060341504,
  ),
  createBuilding(
    BuildingName.CrownClass,
    37.00010258799506,
    -122.05475584520123,
  ),
  createBuilding(
    BuildingName.DigitalArts,
    36.99390854123751,
    -122.0607254543917,
  ),
  createBuilding(
    BuildingName.EarthMarines,
    36.99811412731436,
    -122.05957682985539,
  ),
  createBuilding(
    BuildingName.EastField,
    36.99447156218643,
    -122.05375119762682,
  ),
  createBuilding(BuildingName.EastGym, 36.993640244273784, -122.05467020493651),
  createBuilding(
    BuildingName.ElenaBaskin,
    36.99456170770014,
    -122.06100828166787,
  ),
  createBuilding(
    BuildingName.ElenaBaskinA,
    36.9948294954794,
    -122.06112977688821,
  ),
  createBuilding(
    BuildingName.ElenaBaskinB,
    36.994881940108044,
    -122.0609639769281,
  ),
  createBuilding(
    BuildingName.ElenaBaskinC,
    36.99480851761781,
    -122.06083757497831,
  ),
  createBuilding(
    BuildingName.ElenaBaskinD,
    36.99475345070336,
    -122.06057820474636,
  ),
  createBuilding(
    BuildingName.ElenaBaskinE,
    36.99453842713276,
    -122.06092786208801,
  ),
  createBuilding(
    BuildingName.ElenaBaskinF,
    36.99457251627598,
    -122.06069804036112,
  ),
  createBuilding(
    BuildingName.ElenaBaskinG,
    36.99440731489935,
    -122.06055522257822,
  ),
  createBuilding(
    BuildingName.ElenaBaskinH,
    36.99508647381262,
    -122.06101979078302,
  ),
  createBuilding(
    BuildingName.ElenaBaskinI,
    36.994588249718795,
    -122.06010871180203,
  ),
  createBuilding(
    BuildingName.ElenaBaskinJ,
    36.9943404475732,
    -122.06024332167068,
  ),
  createBuilding(
    BuildingName.ElenaBaskinK,
    36.99444432156574,
    -122.06041992011022,
  ),
  createBuilding(
    BuildingName.ElenaBaskinL,
    36.99442598012994,
    -122.06124924570517,
  ),
  createBuilding(
    BuildingName.ElenaBaskinM,
    36.99466329304529,
    -122.06128207738043,
  ),
  createBuilding(
    BuildingName.ElenaBaskinN,
    36.994803556955404,
    -122.0612913253315,
  ),
  createBuilding(
    BuildingName.ElenaBaskinP,
    36.995038273769076,
    -122.06124524538559,
  ),
  createBuilding(
    BuildingName.Engineering2,
    37.000977159018404,
    -122.06286266934484,
  ),
  createBuilding(BuildingName.Harbor, 36.96402855953381, -122.00025481636563),
  createBuilding(
    BuildingName.HumanitiesSocSci,
    37.0016110372888,
    -122.0552193970828,
  ),
  createBuilding(
    BuildingName.Humanities1,
    36.9981499615289,
    -122.05448858843953,
  ),
  createBuilding(
    BuildingName.HumanitiesLecture,
    36.99846948382388,
    -122.0544624586917,
  ),
  createBuilding(
    BuildingName.InterSci,
    36.998618835093126,
    -122.05979461007455,
  ),
  createBuilding(
    BuildingName.JackBaskinAudit,
    37.0002002140186,
    -122.06234955961028,
  ),
  createBuilding(
    BuildingName.JackBaskin,
    37.00038313198104,
    -122.06319382309817,
  ),
  createBuilding(
    BuildingName.KresgeAcad,
    36.99888949684788,
    -122.06608802748495,
  ),
  createBuilding(BuildingName.Seymour, 36.949432335905435, -122.06496381640797),
  createBuilding(
    BuildingName.McHenryLib,
    36.995736241828155,
    -122.05896221217482,
  ),
  createBuilding(
    BuildingName.TheaterArtsM,
    36.995162213463686,
    -122.06163772054488,
  ),
  createBuilding(
    BuildingName.MerrillAcad,
    36.999622864473665,
    -122.05355116690951,
  ),
  createBuilding(BuildingName.Music, 36.993419595131215, -122.05998253365406),
  createBuilding(
    BuildingName.NatSci2Annex,
    36.99852041971845,
    -122.06111651644305,
  ),
  createBuilding(
    BuildingName.NatSci2Main,
    36.99846693076542,
    -122.06038490797435,
  ),
  createBuilding(
    BuildingName.OakesAcad,
    36.98967399397035,
    -122.06279480157903,
  ),
  createBuilding(
    BuildingName.OceanHealth,
    36.949755549616555,
    -122.06559865922495,
  ),
  createBuilding(
    BuildingName.AthleticsRecreationShed,
    36.993873155943525,
    -122.0544233140016,
  ),
  createBuilding(BuildingName.PhysSci, 36.99968476812773, -122.06182197565835),
  createBuilding(
    BuildingName.PorterAcad,
    36.99403273099864,
    -122.06526157902647,
  ),
  createBuilding(BuildingName.RCAcad, 36.99192070519859, -122.06496466926879),
  createBuilding(
    BuildingName.SNELibrary,
    36.999133953820156,
    -122.06066273110277,
  ),
  createBuilding(BuildingName.SVCampus, 37.37982333412776, -121.97706641189943),
  createBuilding(
    BuildingName.SVExtension,
    37.37981890962501,
    -121.97698705229239,
  ),
  createBuilding(
    BuildingName.Sinsheimer,
    36.99877474756137,
    -122.06162924030511,
  ),
  createBuilding(BuildingName.SocSci1, 37.00239258532575, -122.0580578484773),
  createBuilding(BuildingName.SocSci2, 37.00154106115558, -122.05875365021731),
  createBuilding(
    BuildingName.StevensonAcad,
    36.99717580982575,
    -122.05167423314813,
  ),
  createBuilding(
    BuildingName.StevensonFire,
    36.99692518304219,
    -122.05169582189589,
  ),
  createBuilding(
    BuildingName.StevensonLib,
    36.99714178473625,
    -122.05141933550773,
  ),
  createBuilding(
    BuildingName.TheaterArts,
    36.99484413399594,
    -122.06217460965884,
  ),
  createBuilding(
    BuildingName.TheaterArtsB,
    36.99501080421445,
    -122.06269508246287,
  ),
  createBuilding(
    BuildingName.TheaterArtsE,
    36.995083834434176,
    -122.06186488853207,
  ),
  createBuilding(
    BuildingName.TheaterArtsA,
    36.99475952356935,
    -122.0625247263977,
  ),
  createBuilding(
    BuildingName.TheaterArtsJ,
    36.99439331949685,
    -122.06201037734922,
  ),
  createBuilding(
    BuildingName.TheaterArtsC,
    36.99505394238237,
    -122.06183187564574,
  ),
  createBuilding(
    BuildingName.ThimannLec,
    36.99809224316109,
    -122.06121673907214,
  ),
  createBuilding(
    BuildingName.ThimannLab,
    36.99814371625425,
    -122.06206109077071,
  ),
  createBuilding(
    BuildingName.TennisCourts,
    36.99253452842492,
    -122.0653546178659,
  ),
];

export default Buildings;
