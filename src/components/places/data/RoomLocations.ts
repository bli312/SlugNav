import {
  Building,
  BuildingName,
  findBuildingByName,
} from "./BuildingLocations";

export interface Room {
  building: Building | undefined;
  name: string;
  latitude: number;
  longitude: number;
}

function createRoom(
  building: Building | undefined,
  name: string,
  latitude: number,
  longitude: number,
): Room {
  return {
    building: building,
    name: name,
    latitude: latitude,
    longitude: longitude,
  };
}

// for locations not on google maps, refer to: https://maps.ucsc.edu/
const Rooms: Room[] = [
  createRoom(
    findBuildingByName(BuildingName.AthleticsRecreation),
    "50 Meter Pool",
    36.994748928217845,
    -122.05406589788667,
  ),
  // MISSING Biomedical Sciences Room 200
  // MISSING Biomedical Sciences Room 300
  createRoom(
    findBuildingByName(BuildingName.ClassroomUnit),
    "001",
    36.99788618889238,
    -122.0570384904234,
  ),
  createRoom(
    findBuildingByName(BuildingName.ClassroomUnit),
    "002",
    36.99793187439674,
    -122.05679914153552,
  ),
  // MISSING Coastal Biology Room 110
  // MISSING Coastal Biology Room 115
  // MISSING Coastal Biology Room 203
  // MISSING Communications Building Room 113
  // MISSING Communications Building Room 117
  // MISSING Communications Building Room 121
  // MISSING Communications Building Room 130
  // MISSING Communications Building Room 139
  // MISSING Communications Building Room 150
  // MISSING Cowell Academics Room 113
  // MISSING Cowell Academics Room 216
  // MISSING Cowell Academics Room 222
  // MISSING Cowell Academics Room 223
  // MISSING Cowell Classroom 131
  // MISSING Cowell College 132
  // MISSING Cowell College 134
  // MISSING Cowell College 239
  // MISSING Cowell Press Room 123
  // MISSING Crown Classroom 104
  // MISSING Crown Classroom 105
  // MISSING Crown Classroom 201
  // MISSING Crown Classroom 202
  // MISSING Crown Classroom 208
  // MISSING Digital Arts Room 230
  // MISSING Digital Arts Room 243
  // MISSING Digital Arts Room 308
  // MISSING Earth and Marine Room A176
  createRoom(
    findBuildingByName(BuildingName.EarthMarines),
    "B206",
    36.99793187439674,
    -122.05679914153552,
  ),
  // MISSING Earth and Marine Room B210
  // MISSING Earth and Marine Room B214
  // MISSING Earth and Marine Room D226
  // MISSING Earth and Marine Room D236
  // MISSING Earth and Marine Room D250
  // MISSING Earth and Marine Room D258
  // MISSING Earth and Marine Room D266
  // MISSING Elena Baskin Arts Building E Room 101
  // MISSING Elena Baskin Arts Building E Room 102
  // MISSING Elena Baskin Arts Building G Room 101
  // MISSING Elena Baskin Arts Building H Room 101
  createRoom(
    findBuildingByName(BuildingName.ElenaBaskinI),
    "200",
    36.99460637441837,
    -122.0600543915645,
  ),
  // MISSING Elena Baskin Arts Building J Room 101
  // MISSING Elena Baskin Arts Building L Room 101
  // MISSING Elena Baskin Arts Building M Room 101
  // MISSING Elena Baskin Arts Building P Room 101
  createRoom(
    findBuildingByName(BuildingName.Engineering2),
    "192",
    37.00094020007238,
    -122.0626815988269,
  ),
  // MISSING Engineering 2 Room 194
  // MISSING Engineering 2 Room 499
  // MISSING Engineering 2 Room 585
  // MISSING Humanities and Social Sciences Room 250
  // MISSING Humanities and Social Sciences Room 359
  // MISSING Humanities and Social Sciences Room 350
  // MISSING Humanities 1 Room 110
  // MISSING Humanities 1 Room 300
  // MISSING Humanities 1 Room 320
  // MISSING Humanities 1 Room 400
  // MISSING Humanities 1 Room 420
  // MISSING Humanities 1 Room 545
  // MISSING Humanities 1 Room 620
  // MISSING Interdisciplinary Sciences Building Room 165
  // MISSING Interdisciplinary Sciences Building Room 221
  // MISSING Interdisciplinary Sciences Building Room 231
  // MISSING Interdisciplinary Sciences Building Room 413
  // MISSING Interdisciplinary Sciences Building Room 431
  // MISSING Interdisciplinary Sciences Building Room 455
  // MISSING Interdisciplinary Sciences Building Room 486
  // MISSING Jack Baskin Engineering Room 097
  // MISSING Jack Baskin Engineering Room 152
  // MISSING Jack Baskin Engineering Room 156
  // MISSING Jack Baskin Engineering Room 165
  // MISSING Jack Baskin Engineering Room 169
  // MISSING Jack Baskin Engineering Room 250
  // MISSING Jack Baskin Engineering Room 372
  // MISSING Kresge Academics Room 1302
  // MISSING Kresge Academics Room 2303
  // MISSING Kresge Academics Room 3101
  // MISSING Kresge Academics Room 3105
  // MISSING Kresge Academics Room 3201
  // MISSING Kresge Academics Room 3301
  // MISSING LG Discovery Room 128
  // MISSING McHenry Classroom 0266
  // MISSING McHenry Classroom 0270
  // MISSING McHenry Classroom 1253
  // MISSING McHenry Classroom 1256
  // MISSING McHenry Classroom 1270
  // MISSING McHenry Classroom 1279
  // MISSING McHenry Classroom 3148
  // MISSING McHenry Classroom 3170
  // MISSING McHenry Classroom 4130
  createRoom(
    findBuildingByName(BuildingName.McHenryLib),
    "1340",
    36.99552795215951,
    -122.05898932492316,
  ),
  createRoom(
    findBuildingByName(BuildingName.McHenryLib),
    "1350",
    36.995464954671775,
    -122.05877941165137,
  ),
  createRoom(
    findBuildingByName(BuildingName.TheaterArtsM),
    "110",
    36.99522988511178,
    -122.06155531315096,
  ),
  // MISSING Merrill Academics Room 002
  // MISSING Merrill Academics Room 003
  // MISSING Merrill Academics Room 102
  // MISSING Merrill Academics Room 130
  // MISSING Merrill Academics Room 132
  // MISSING Merrill Academics Room 134
  // MISSING Music Center Room 101
  // MISSING Music Center Room 114
  // MISSING Music Center Room 130
  // MISSING Music Center Room 101
  // MISSING Music Center Room 131
  // MISSING Music Center Room 134
  // MISSING Music Center Room 138
  // MISSING Music Center Room 191A
  // MISSING Music Center Room 245
  createRoom(
    findBuildingByName(BuildingName.NatSci2Annex),
    "101",
    36.99859732004918,
    -122.06111826256146,
  ),
  createRoom(
    findBuildingByName(BuildingName.NatSci2Annex),
    "102",
    36.99844542030661,
    -122.0611078212978,
  ),
  createRoom(
    findBuildingByName(BuildingName.NatSci2Annex),
    "103",
    36.99842900643725,
    -122.06105705284891,
  ),
  // MISSING Natural Science Main Building 2 Room 110
  // MISSING Natural Science Main Building 2 Room 229
  // MISSING Natural Science Main Building 2 Room 233
  // MISSING Oakes Academics Room 101
  // MISSING Oakes Academics Room 102
  // MISSING Oakes Academics Room 103
  createRoom(
    findBuildingByName(BuildingName.OakesAcad),
    "105",
    36.989615982561574,
    -122.06272028517667,
  ),
  // MISSING Oakes Academics Room 106
  // MISSING Oakes Academics Room 222
  // MISSING Ocean Health Building Room 118
  // MISSING Ocean Health Building Room 151
  // MISSING Ocean Health Building Room 251
  createRoom(
    findBuildingByName(BuildingName.PhysSci),
    "110",
    36.99937065610728,
    -122.06167735780055,
  ),
  createRoom(
    findBuildingByName(BuildingName.PhysSci),
    "114",
    36.99937065610728,
    -122.0616947376665,
  ),
  createRoom(
    findBuildingByName(BuildingName.PhysSci),
    "130",
    36.999460585884165,
    -122.06182782911551,
  ),
  createRoom(
    findBuildingByName(BuildingName.PhysSci),
    "136",
    36.999466644721856,
    -122.06190938327425,
  ),
  createRoom(
    findBuildingByName(BuildingName.PhysSci),
    "140",
    36.99945755646532,
    -122.06196722982858,
  ),
  createRoom(
    findBuildingByName(BuildingName.PhysSci),
    "145",
    36.99947035289295,
    -122.06205450507179,
  ),
  // MISSING Physical Sciences Room 240
  // MISSING Physical Sciences Room 341
  // MISSING Physical Sciences Room 450
  createRoom(
    findBuildingByName(BuildingName.PorterAcad),
    "144",
    36.99400301575259,
    -122.06536226173785,
  ),
  createRoom(
    findBuildingByName(BuildingName.PorterAcad),
    "148",
    36.99403273099864,
    -122.06526157902647,
  ),
  createRoom(
    findBuildingByName(BuildingName.PorterAcad),
    "241",
    36.99402955428894,
    -122.06540161092305,
  ),
  // MISSING Porter Academics Room 245
  createRoom(
    findBuildingByName(BuildingName.PorterAcad),
    "246",
    36.99402617903544,
    -122.0653853054804,
  ),
  // MISSING Porter Academics Room 249
  createRoom(
    findBuildingByName(BuildingName.RCAcad),
    "250",
    36.99210550621626,
    -122.06482713149423,
  ),
  createRoom(
    findBuildingByName(BuildingName.RCAcad),
    "252",
    36.99210890061941,
    -122.06492324811721,
  ),
  // MISSING Rachel Carson Academics Room 240
  // MISSING Rachel Carson Academics Room 242
  // MISSING Rachel Carson Academics Room 301
  createRoom(
    findBuildingByName(BuildingName.SNELibrary),
    "206",
    36.99913155226583,
    -122.06097620542073,
  ),
  // MISSING Sinsheimer Lab 123
  createRoom(
    findBuildingByName(BuildingName.SocSci1),
    "110",
    37.001979114171945,
    -122.05798830316414,
  ),
  createRoom(
    findBuildingByName(BuildingName.SocSci1),
    "145",
    37.002500985246684,
    -122.05801531961626,
  ),
  createRoom(
    findBuildingByName(BuildingName.SocSci1),
    "149",
    37.002433378660136,
    -122.05799470831629,
  ),
  createRoom(
    findBuildingByName(BuildingName.SocSci1),
    "153",
    37.00236756116708,
    -122.05799006521808,
  ),
  createRoom(
    findBuildingByName(BuildingName.SocSci1),
    "161",
    37.00228843754827,
    -122.0579651115743,
  ),
  // MISSING Social Sciences 1 Room 414
  // MISSING Social Sciences 1 Room 431
  // MISSING Social Sciences 1 Room 435
  // MISSING Social Sciences 1 Room 461
  // MISSING Social Sciences 2 Room 047
  createRoom(
    findBuildingByName(BuildingName.SocSci2),
    "071",
    37.00150271616585,
    -122.05884841585552,
  ),
  createRoom(
    findBuildingByName(BuildingName.SocSci2),
    "075",
    37.00157466289991,
    -122.05891195223238,
  ),
  // MISSING Social Sciences 2 Room 104
  // MISSING Social Sciences 2 Room 115
  // MISSING Social Sciences 2 Room 121
  createRoom(
    findBuildingByName(BuildingName.SocSci2),
    "137",
    37.0018541185183,
    -122.05880289725651,
  ),
  createRoom(
    findBuildingByName(BuildingName.SocSci2),
    "141",
    37.00181322263865,
    -122.05877729304493,
  ),
  createRoom(
    findBuildingByName(BuildingName.SocSci2),
    "159",
    37.00158753757379,
    -122.05861039151767,
  ),
  createRoom(
    findBuildingByName(BuildingName.SocSci2),
    "165",
    37.001557244225495,
    -122.058670134678,
  ),
  createRoom(
    findBuildingByName(BuildingName.SocSci2),
    "167",
    37.00151331884902,
    -122.05875927526642,
  ),
  createRoom(
    findBuildingByName(BuildingName.SocSci2),
    "171",
    37.00145651875564,
    -122.0588266048598,
  ),
  createRoom(
    findBuildingByName(BuildingName.SocSci2),
    "179",
    37.001539068210725,
    -122.05888160649948,
  ),
  // MISSING Social Sciences 2 Room 215
  // MISSING Social Sciences 2 Room 221
  createRoom(
    findBuildingByName(BuildingName.SocSci2),
    "363",
    37.001482268136556,
    -122.05868910076066,
  ),
  // MISSING Stevenson Academics Room 129
  // MISSING Stevenson Academics Room 131
  createRoom(
    findBuildingByName(BuildingName.StevensonAcad),
    "150",
    36.99716392241645,
    -122.05169890254543,
  ),
  createRoom(
    findBuildingByName(BuildingName.StevensonAcad),
    "151",
    36.99725093429767,
    -122.0517161984107,
  ),
  createRoom(
    findBuildingByName(BuildingName.StevensonAcad),
    "152",
    36.997319941753304,
    -122.05175839552227,
  ),
  createRoom(
    findBuildingByName(BuildingName.StevensonAcad),
    "175",
    36.99699175457352,
    -122.05168203884413,
  ),
  // MISSING Stevenson Academics Room 213
  // MISSING Stevenson Fireside Lounge 177
  createRoom(
    findBuildingByName(BuildingName.TheaterArts),
    "2nd Stage",
    36.99464667628062,
    -122.06186322877802,
  ),
  // MISSING Theater Arts B Drama Room 100
  // MISSING Theater Arts Lecture E Room 100
  // MISSING Theater Arts Mainstage A Room 104
  // MISSING Theater Arts Mainstage A Room 105
  // MISSING Theater Arts Mainstage A Room 214
  // MISSING Theater Arts Offices J Room 101
  // MISSING Theater Arts Offices J Room 102
  // MISSING Theater Arts Studio C Room 100
  // MISSING Theater Arts Studio C Room 102
  // MISSING Thimann Lecture Hall Room 001
  // MISSING Thimann Lecture Hall Room 003
  // MISSING Thimann Laboratories Room 101
  // MISSING Thimann Laboratories Room 115
  // MISSING Thimann Laboratories Room 133
  // MISSING Thimann Laboratories Room 203
  // MISSING Thimann Laboratories Room 215
  // MISSING Thimann Laboratories Room 239
  // MISSING Thimann Laboratories Room 397
  createRoom(
    findBuildingByName(BuildingName.TheaterArts),
    "2nd Stage",
    36.99221644365824,
    -122.06608863868685,
  ),
];

export default Rooms;
