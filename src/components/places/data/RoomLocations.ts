import { Building, findBuildingByName } from "./BuildingLocations";

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

const Rooms: Room[] = [
  createRoom(
    findBuildingByName("Athletics and Recreation East Field House Complex"),
    "50 Meter Pool",
    36.994748928217845,
    -122.05406589788667,
  ),
  // MISSING Biomedical Sciences Room 200
  // MISSING Biomedical Sciences Room 300
  createRoom(
    findBuildingByName("Classroom Unit Building"),
    "001",
    36.99788618889238,
    -122.0570384904234,
  ),
  createRoom(
    findBuildingByName("Classroom Unit Building"),
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
    findBuildingByName("Earth and Marine Sciences Building"),
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
  // MISSING Elena Baskin Arts Room E101
  // MISSING Elena Baskin Arts Room E102
  // MISSING Elena Baskin Arts Room G101
  // MISSING Elena Baskin Arts Room H101
  createRoom(
    findBuildingByName("Elena Baskin Visual Arts Center"),
    "I200",
    36.99460637441837,
    -122.0600543915645,
  ),
  // MISSING Elena Baskin Arts Room J101
  // MISSING Elena Baskin Arts Room L101
  // MISSING Elena Baskin Arts Room M101
  // MISSING Elena Baskin Arts Room P101
  createRoom(
    findBuildingByName("Engineering 2"),
    "192",
    37.00094020007238,
    -122.0626815988269,
  ),
  // MISSING Engineering 2 Room 194
  // MISSING Engineering 2 Room 499
  // MISSING Engineering 2 Room 585
  // MISSING Humanities and Social Sciences Room 250
  // MISSING Humanities and Social Sciences Room 350
  // MISSING Humanities 1 Room 110
  // MISSING Humanities 1 Room 300
  // MISSING Humanities 1 Room 320
  // MISSING Humanities 1 Room 400
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
];

export default Rooms;
