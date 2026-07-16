# TableMate frontend (Expo)

React Native app managed by [Expo](https://expo.dev) (SDK 57). Runs in **Expo Go** — no native builds, no API keys on the client.

> Maps: Android renders Google Maps (Expo Go's bundled SDK). iOS in Expo Go renders **Apple Maps** — Google Maps on iOS would require an EAS development build.

## Prerequisites

- Node ≥ 22
- The backend running and reachable on your LAN:

  ```sh
  cd ../backend
  uvicorn app:app --host 0.0.0.0 --port 8000
  ```

  `--host 0.0.0.0` matters — your phone connects over Wi-Fi. Allow Python through the Windows Firewall when prompted (private networks).

## Run

```sh
npm install
npm start          # = npx expo start
```

- **Android emulator**: start a device in Android Studio, then press `a` in the Expo terminal. Expo Go installs into the emulator automatically.
- **iPhone**: install *Expo Go* from the App Store, join the same Wi-Fi as this machine, and scan the QR code from the terminal (Camera app).

The API/WebSocket host is auto-detected from the Expo dev server (`src/api/config.ts` reads `Constants.expoConfig.hostUri`), so no IP needs to be configured for either device.

## Checks

```sh
npx tsc --noEmit   # 2 known pre-existing errors in ProfileScreen/QueueScreen
npm test           # jest (jest-expo preset; maps/async-storage mocked in jest.setup.js)
npx expo-doctor    # project health
```
