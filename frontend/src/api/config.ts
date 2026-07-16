import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 8000;

// In an Expo dev session, hostUri is the dev machine as seen from this device
// (e.g. "192.168.0.10:8081"). Reusing its IP means a physical phone and an
// emulator both reach the backend with no manual configuration — the backend
// just has to listen on 0.0.0.0.
function resolveHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  const ip = hostUri?.split(':')[0];
  if (ip) {
    return `${ip}:${API_PORT}`;
  }
  // Fallback: iOS simulator reaches the host via localhost; the Android
  // emulator uses the 10.0.2.2 alias.
  return Platform.OS === 'android'
    ? `10.0.2.2:${API_PORT}`
    : `localhost:${API_PORT}`;
}

export const API_HOST = resolveHost();

export const API_BASE = `http://${API_HOST}`;
export const WS_BASE = `ws://${API_HOST}`;
