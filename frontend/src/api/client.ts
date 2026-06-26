import { VenueCategory, SoloMenuRecommendation } from '../types/tablemate';
import { API_BASE } from './config';
import { clearToken, getCachedToken } from './authStore';
import {
  ApiMessage,
  ApiNearbyPlace,
  ApiPlaceRef,
  ApiQueueInfo,
  ApiQueueOut,
  ApiUser,
  ApiVisit,
} from './types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Invoked when any request gets a 401, so the app can return to the login screen.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
      return data.detail[0].msg;
    }
    return JSON.stringify(data);
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

type FetchOpts = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = getCachedToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    await clearToken();
    onUnauthorized?.();
    throw new ApiError(401, await parseError(res));
  }
  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

// ---------- Auth ----------

export type RegisterPayload = {
  email: string;
  password: string;
  real_name: string;
  birth_date: string; // YYYY-MM-DD
  nickname: string;
};

export function register(payload: RegisterPayload): Promise<{ access_token: string }> {
  return apiFetch('/users/register', { method: 'POST', body: payload, auth: false });
}

// /users/login uses OAuth2PasswordRequestForm — form-urlencoded, not JSON.
export async function loginRequest(
  email: string,
  password: string,
): Promise<{ access_token: string }> {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);

  const res = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: form.toString(),
  });
  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  return (await res.json()) as { access_token: string };
}

export function getMe(): Promise<ApiUser> {
  return apiFetch('/users/me');
}

// ---------- Places (live from Google via backend) ----------

export function fetchNearbyPlaces(
  category: VenueCategory,
  latitude: number,
  longitude: number,
): Promise<ApiNearbyPlace[]> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    type: category,
  });
  return apiFetch(`/places/nearby?${params.toString()}`, { auth: false });
}

// Resolve a local int place id (stored on visits) to its reference row.
export function getPlaceRef(placeId: number): Promise<ApiPlaceRef> {
  return apiFetch(`/places/${placeId}`, { auth: false });
}

// ---------- Queues ----------

export function fetchQueueInfo(googlePlaceId: string): Promise<ApiQueueInfo> {
  return apiFetch(`/queues/info/${encodeURIComponent(googlePlaceId)}`, {
    auth: false,
  });
}

export function createQueue(
  googlePlaceId: string,
  name: string,
): Promise<ApiQueueOut> {
  return apiFetch('/queues', { method: 'POST', body: { googlePlaceId, name } });
}

export function joinQueue(queueId: number): Promise<ApiQueueOut> {
  return apiFetch(`/queues/${queueId}/join`, { method: 'POST' });
}

export function fetchMessages(queueId: number): Promise<ApiMessage[]> {
  return apiFetch(`/queues/${queueId}/messages`);
}

export function postMessage(queueId: number, body: string): Promise<ApiMessage> {
  return apiFetch(`/queues/${queueId}/messages`, { method: 'POST', body: { body } });
}

// ---------- Recommendations ----------

export function fetchSoloRecommendations(
  hour: number,
): Promise<SoloMenuRecommendation[]> {
  return apiFetch(`/recommendations/solo?hour=${hour}`, { auth: false });
}

// ---------- Visits ----------

export function getMyVisits(): Promise<ApiVisit[]> {
  return apiFetch('/visits/me');
}
