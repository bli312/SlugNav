import type { LeafletPopup } from "./LeafletPopup";

export default interface Marker {
  latitude: number;
  longitude: number;
  popup?: LeafletPopup;
  openPopup?: boolean;
}
