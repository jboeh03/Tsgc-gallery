/**
 * Service-area neighborhoods → centroid coordinates.
 *
 * Map pins snap to these neighborhood centroids — we deliberately never plot a
 * customer's exact address (privacy + safety). To add a stop the schedule just
 * references one of these keys; no live geocoding API is needed because the
 * service area is fixed.
 *
 * Add a new neighborhood here (look up its rough lat/lng once) and it becomes
 * available to `data/schedule.json`.
 */
export type Area = { label: string; lat: number; lng: number };

export const AREAS: Record<string, Area> = {
  "hyde-park": { label: "Hyde Park, Cincinnati", lat: 39.1393, lng: -84.435 },
  "mt-lookout": { label: "Mt. Lookout, Cincinnati", lat: 39.1209, lng: -84.4263 },
  "anderson-twp": { label: "Anderson Township", lat: 39.0782, lng: -84.336 },
  "blue-ash": { label: "Blue Ash", lat: 39.232, lng: -84.3783 },
  "madeira": { label: "Madeira", lat: 39.1917, lng: -84.3638 },
  "mason": { label: "Mason", lat: 39.3601, lng: -84.3099 },
  "west-chester": { label: "West Chester", lat: 39.3576, lng: -84.4022 },
  "loveland": { label: "Loveland", lat: 39.2687, lng: -84.2633 },
  "florence-ky": { label: "Florence, KY", lat: 38.9989, lng: -84.6266 },
  "fort-mitchell-ky": { label: "Fort Mitchell, KY", lat: 39.0573, lng: -84.5571 },
  "dayton": { label: "Dayton", lat: 39.7589, lng: -84.1916 },
};

export function getArea(id: string): Area | undefined {
  return AREAS[id];
}
