import { API_BASE } from './config';
import { clearToken, getCachedToken } from './authStore';
import { ApiUser } from './types';
import { ClassifyResult, Need, Recommendation, RouteResult, Visit } from '../types/recommendation';
import { MapCoordinate } from '../services/locationService';

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

// ---------- Classify ----------

export function postClassifyNeed(text: string): Promise<ClassifyResult> {
  return apiFetch('/classify', { method: 'POST', body: { text } });
}

// ---------- Recommendations ----------

export function postRecommendations(need: Need): Promise<Recommendation[]> {
  return apiFetch('/recommendations', { method: 'POST', body: need });
}

// ---------- Routes ----------

export function postRoute(
  origin: MapCoordinate,
  destination: MapCoordinate,
): Promise<RouteResult> {
  return apiFetch('/routes', {
    method: 'POST',
    body: {
      origin: { lat: origin.latitude, lng: origin.longitude },
      destination: { lat: destination.latitude, lng: destination.longitude },
    },
  });
}

// ---------- Visits ----------

export type VisitPayload = {
  placeId: string;
  placeName: string;
  type: Need['type'];
};

export function postVisit(payload: VisitPayload): Promise<void> {
  return apiFetch('/visits', { method: 'POST', body: payload });
}

export function getVisits(): Promise<Visit[]> {
  return apiFetch('/visits');
}

// Hides the user's visible history from this point on — it does NOT delete
// any Visit row server-side, so recommendation personalization (which reads
// Visit directly, never this cutoff) is unaffected. See
// backend/models.py's HistoryClear docstring for the full reasoning.
export function clearVisits(): Promise<void> {
  return apiFetch('/visits', { method: 'DELETE' });
}
