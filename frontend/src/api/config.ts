import { Platform } from 'react-native';

// iOS simulator reaches the host machine via localhost; the Android emulator
// uses the 10.0.2.2 alias. For a physical device, replace this with your
// machine's LAN IP (e.g. '192.168.0.10:8000').
export const API_HOST =
  Platform.OS === 'android' ? '10.0.2.2:8000' : 'localhost:8000';

export const API_BASE = `http://${API_HOST}`;
