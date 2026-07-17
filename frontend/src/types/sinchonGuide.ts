export type VenueCategory = 'restaurant' | 'cafe' | 'bar';

export type AppRoute = 'home' | 'preference' | 'queue' | 'solo';

export type HomeTab = 'together' | 'solo';

export type QueueMode = 'join' | 'create';

export type QueueInfo = {
  placeId: string;
  exists: boolean;
  waitingCount: number;
};

/** A place candidate shown on the map, sourced live from Google Places.
 *  `id` is the Google place id — the identifier used for queues/visits. */
export type PlacePin = {
  id: string;
  name: string;
  meta: string;
  note: string;
  menu: string[];
  latitude: number;
  longitude: number;
};

export type SoloMenuRecommendation = {
  id: string;
  menuName: string;
  venueName: string;
  category: VenueCategory;
  description: string;
  distance: string;
  tags: string[];
  score: number;
  reason: string;
};
