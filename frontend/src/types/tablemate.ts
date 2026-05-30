export type VenueCategory = 'restaurant' | 'cafe' | 'bar';

export type AppRoute = 'home' | 'preference' | 'queue' | 'solo';

export type HomeTab = 'together' | 'solo';

export type QueueMode = 'join' | 'create';

export type QueueInfo = {
  placeId: string;
  exists: boolean;
  waitingCount: number;
};

export type Recommendation = {
  id: string;
  category: VenueCategory;
  name: string;
  description: string;
  distance: string;
  tags: string[];
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

