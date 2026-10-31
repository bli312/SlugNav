export interface Location {
  name: string | null;
  room: Array<Room> | null;
}
export interface Room {
  name: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const mockLocations: Array<Location> = [
  {
    name: "Physical Sciences",
    room: [
      {
        name: "114",
        latitude: 36.99937065610728,
        longitude: -122.0616947376665,
      },
    ],
  },
  {
    name: "Stevenson Academics",
    room: [
      {
        name: "150",
        latitude: 36.99716392241645,
        longitude: -122.05169890254543,
      },
    ],
  },
];
