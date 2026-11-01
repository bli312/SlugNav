import { Class } from "@/components/classes/mockClasses";
import { createPopup, LeafletPopup } from "./LeafletPopup";
import { mockLocations } from "@/components/classes/mockLocations";

export default interface Marker {
  latitude: number;
  longitude: number;
  popup?: LeafletPopup;
}

export function parse(classes: Array<Class>): Array<Marker> {
  const markers = new Array<Marker>();
  classes.forEach((classElement) => {
    const location = mockLocations.find(
      (location) => location.name === classElement.location,
    );
    // break location search if not found
    if (!location || !location.room) return;
    const room = location.room.find((room) => room.name === classElement.room);
    // break room search if not found
    if (!room || !room.name) return;
    markers.push({
      latitude: room.latitude!,
      longitude: room.longitude!,
      popup: createPopup(
        `${classElement.courseCode} - ${classElement.title}`,
        `${classElement.location!} (${classElement.room!})`,
        undefined,
      ),
    });
  });
  return markers;
}
