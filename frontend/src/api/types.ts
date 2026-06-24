import { VenueCategory } from '../types/tablemate';

// Shapes returned by the FastAPI backend (camelCase, matching the TS types).

export type ApiPlace = {
  id: number;
  slug: string | null;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  placeType: VenueCategory;
  meta: string | null;
  note: string | null;
  menu: string[];
  distanceMinutes: number | null;
  revisitedRate: number;
  createdAt: string;
};

export type ApiQueueInfo = {
  placeId: string; // the Place.slug
  exists: boolean;
  waitingCount: number;
  queueId: number | null;
};

export type ApiQueueOut = {
  id: number;
  placeId: number;
  placeSlug: string | null;
  status: 'open' | 'closed';
  waitingCount: number;
  createdAt: string;
};

export type ApiMessage = {
  id: number;
  queueId: number;
  userId: number | null;
  senderType: 'system' | 'user';
  body: string;
  createdAt: string;
};

// Note: the /users/me response (UserSelf) is NOT aliased to camelCase — it
// returns snake_case fields. Only id/email/nickname are used by the app.
export type ApiUser = {
  id: number;
  email: string;
  real_name: string;
  birth_date: string;
  nickname: string;
  created_at: string;
};

export type ApiVisit = {
  id: number;
  user_id: number;
  place_id: number;
  arrived_at: string;
  left_at: string | null;
  mood: number | null;
  price: number | null;
  disliked: boolean;
  feedback_submitted: boolean;
  created_at: string;
};
