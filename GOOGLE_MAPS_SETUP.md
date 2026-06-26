# Google Maps setup

This app renders **Google Maps** on iOS and Android and fetches place details
live from **Google Places** (server-side). You need a billing-enabled Google
Cloud project and API keys before maps/places will work.

## 1. Enable APIs (Google Cloud Console)

On your project, enable:

- **Maps SDK for Android** (client)
- **Maps SDK for iOS** (client)
- **Places API (New)** (backend)
- **Geocoding API** (backend)

Then create API keys. Recommended: **two restricted keys** —

- **Client key** for the apps. Restrict by app: Android (package `com.tablemate`
  + your debug/release SHA-1) and iOS (bundle id `com.tablemate`). You can use one
  key for both platforms or split them.
- **Server key** for the backend. Restrict by API (Places + Geocoding) and, ideally,
  by your server IP. Never ship this key in the app.

## 2. Android (client key)

The manifest reads `com.google.android.geo.API_KEY` from a `GOOGLE_MAPS_API_KEY`
Gradle property (wired in `frontend/android/app/build.gradle`). Put the key
**outside the repo** in your user-level Gradle file so it's never committed:

`~/.gradle/gradle.properties`

```
GOOGLE_MAPS_API_KEY=AIza...your_android_key...
```

Rebuild: `cd frontend && npm run android`.

## 3. iOS (client key)

1. `cd frontend/ios && cp Secrets.example.xcconfig Secrets.xcconfig` and set
   `GOOGLE_MAPS_API_KEY` in it (`Secrets.xcconfig` is gitignored).
2. In Xcode, set that xcconfig as the project's configuration file for Debug and
   Release (see the comments in `Secrets.example.xcconfig`). `Info.plist` exposes
   it as `GMSApiKey = $(GOOGLE_MAPS_API_KEY)`; `AppDelegate.swift` calls
   `GMSServices.provideAPIKey(...)` with it at launch.
3. Install pods (pulls in the GoogleMaps SDK): `cd frontend/ios && pod install`.
   - If `pod install` or the build fails on framework linkage, the GoogleMaps pod
     needs `use_frameworks!` / static linkage; resolve that in `Podfile` before
     continuing (known react-native-maps + Hermes friction point).
4. Run: `cd frontend && npm run ios`.

## 4. Backend (server key)

```
cd backend
cp .env.example .env        # then set GOOGLE_MAPS_API_KEY=...
pip install -r requirements.txt
python seed.py              # seeds solo-menu recommendations (places are not seeded)
uvicorn app:app --reload
```

Smoke test (Sinchon):

```
curl "http://localhost:8000/places/nearby?lat=37.5559&lng=126.9368&type=cafe"
```

You should get live Google cafés with real coordinates.

## Notes

- The DB stores only behavioural data ("who visited where, when" + queues). Place
  details (name, address, coords, rating) come live from Google and are not stored;
  a thin `places` row (id ↔ `google_place_id`, cached `name`) is created on demand
  to anchor visit/queue foreign keys.
- Nearby Search is billed per call; the backend caches responses briefly
  (`PLACES_CACHE_TTL_S`) to limit cost.
