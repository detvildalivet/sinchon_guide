// The categorized "what do you need?" contract (backend schemas.NeedIn).
// A future free-text/LLM input stage just needs to emit this same shape —
// everything downstream (Places lookup, scoring, this file) is unaffected.
export type NeedType = 'meal' | 'cafe' | 'drinks' | 'dessert';
export type Budget = 'cheap' | 'mid' | 'splurge';

export type Need = {
  type: NeedType;
  budget: Budget;
  lat: number;
  lng: number;
};

// Matches backend schemas.RecommendationOut (camelCase aliases).
export type Recommendation = {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  rating: number | null;
  priceLevel: number | null;
  distanceMinutes: number;
  openNow: boolean | null;
  score: number;
  reason: string;
};

// Matches backend schemas.RouteOut. `coordinates` is the walking-path
// geometry from TMAP's Pedestrian Route API, already in the {latitude,
// longitude} shape NaverMapPathOverlay's `coords` prop expects directly.
export type RouteResult = {
  coordinates: { latitude: number; longitude: number }[];
  distanceMinutes: number;
  distanceMeters: number;
};
