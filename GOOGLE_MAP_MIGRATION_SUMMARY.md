# Google Maps + Google Places migration — summary

Work branch: **`UsingGoogleMap`**.

## Phase A — Google Maps rendering (both platforms)
- `LiveMapView.tsx`: now uses `provider={PROVIDER_GOOGLE}`, `mapType="standard"`; removed the OpenStreetMap `UrlTile` overlay.
- **Android**: `AndroidManifest.xml` gets the `com.google.android.geo.API_KEY` meta-data, fed by a `manifestPlaceholders` Gradle property in `build.gradle`.
- **iOS**: `Podfile` adds the `react-native-google-maps` pod; `AppDelegate.swift` calls `GMSServices.provideAPIKey(...)` reading `GMSApiKey` from `Info.plist` (`$(GOOGLE_MAPS_API_KEY)`).

## Phase B — Backend Google Places proxy (server-side)
- New `config.py` (loads `.env`) and `services/google_places.py` — async **Places API (New)** nearby/details + Geocoding, with a short TTL cache to limit billing.
- `routers/places.py` reworked: `GET /places/nearby`, `GET /places/details/{id}`, `GET /places/{place_id}`, plus a `resolve_place_id` helper.
- **`Place` model slimmed** to a thin reference (`id` ↔ `google_place_id` + cached `name` + behavioral `revisited_rate`). Queues/visits now key on `google_place_id` and lazily create the row. `seed.py` no longer seeds places (only the curated solo-menu recommendations, which are independent).
- Verified: app imports, routes register, and `resolve_place_id` dedupes + schemas round-trip on a throwaway DB.

## Phase C — Frontend data wiring
- `usePlaces(category, center)` calls `/places/nearby` and returns **real** coordinates; `PreferenceScreen` markers now sit at actual venue locations (deleted the fake-offset `getPlaceCoordinates`).
- `PlacePin` moved to `types/tablemate.ts` with `latitude/longitude/googlePlaceId`; queue/visit calls send `googlePlaceId` + name; `ProfileScreen` resolves visit history via `getPlaceRef`.
- Deleted dead files: `FloatingPlacePins.tsx`, `design/placeLayout.ts`, `design/mapCoordinates.ts`.

## Phase D — Secrets
- Gitignored `backend/.env` and `ios/Secrets.xcconfig`; added `backend/.env.example`, `ios/Secrets.example.xcconfig`, and **`GOOGLE_MAPS_SETUP.md`** (GCP APIs, key restrictions, Android/iOS/backend wiring, smoke test).

## Things you need to do before it runs
1. **GCP**: enable Maps SDK (Android + iOS), Places API (New), Geocoding API; create keys.
2. **Android key** → `~/.gradle/gradle.properties`; **iOS key** → `ios/Secrets.xcconfig` + attach it in Xcode; **server key** → `backend/.env`.
3. **iOS**: `cd frontend/ios && pod install` — the risky step (GoogleMaps SDK linkage vs Hermes). If it fails, resolve `use_frameworks!`/static linkage in the Podfile.
4. **Backend**: `pip install -r requirements.txt`, **delete the old `sinchon_guide.db`** (schema changed), `python seed.py`, then `uvicorn app:app --reload`.

Full steps are in `GOOGLE_MAPS_SETUP.md`.

## Two heads-ups
- **Menu chips & category icons** in the place card / visit history are gone for live places — Google Nearby Search doesn't return menu items, and category isn't stored. The detail card now shows rating + address; history uses a neutral 📍.
- The frontend typecheck surfaces **2 pre-existing errors** (`ProfileScreen` duplicate `footer` style; `QueueScreen` missing `pressed` style) — both confirmed on the base commit, in lines not touched by this work. The app tolerates them (Metro uses Babel).
