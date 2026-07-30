// The categorized "what do you need?" contract (backend schemas.NeedIn).
// AskScreen has no buttons — it's a pure text input, so `type` is an open
// string produced by POST /classify (src/api/client.ts's
// postClassifyNeed): either one of the 4 curated categories
// (meal/cafe/drinks/dessert — Kakao's dedicated category-code search on
// the backend) or an arbitrary Korean place-type keyword Claude extracted
// (e.g. "당구장"), routed to a plain Kakao keyword search instead.
// Everything downstream (Places lookup, scoring, this file) treats it as
// an opaque string either way.
export type Need = {
  type: string;
  lat: number;
  lng: number;
};

// Matches backend schemas.ClassifyOut. type is null when Claude couldn't
// tell what kind of place the user wants — AskScreen shows an inline retry
// prompt in that case; there is no button-grid fallback.
export type ClassifyResult = {
  type: string | null;
};

// Matches backend schemas.RecommendationOut (camelCase aliases).
export type Recommendation = {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  rating: number | null;
  ratingCount: number | null;
  distanceMinutes: number;
  openNow: boolean | null;
  category: string | null;
  address: string | null;
  score: number;
  reason: string;
};

// Matches backend schemas.VisitOut — a read-back row for the History screen.
export type Visit = {
  placeId: string;
  placeName: string;
  type: string;
  createdAt: string; // ISO datetime
};

// Matches backend schemas.RouteOut. `coordinates` is the walking-path
// geometry from TMAP's Pedestrian Route API, already in the {latitude,
// longitude} shape NaverMapPathOverlay's `coords` prop expects directly.
export type RouteResult = {
  coordinates: { latitude: number; longitude: number }[];
  distanceMinutes: number;
  distanceMeters: number;
};
