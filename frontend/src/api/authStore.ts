import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'sinchonguide.jwt';

// In-memory cache so request builders can read the token synchronously after
// the initial load. AsyncStorage remains the source of truth across launches.
let cachedToken: string | null = null;

export function getCachedToken(): string | null {
  return cachedToken;
}

export async function loadToken(): Promise<string | null> {
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setToken(token: string): Promise<void> {
  cachedToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  cachedToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}
