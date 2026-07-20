# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sinchon Guide (frontend app name: **Sinchon Guide**, package `com.sinchonguide`) — a place-recommendation app for the Sinchon area. One linear pipeline: **ask what the user needs → categorize the answer → recommend a real nearby place → guide them there.** Two independent apps in one repo:

- `backend/` — FastAPI + SQLAlchemy + SQLite (`sinchon_guide.db`)
- `frontend/` — React Native 0.85 (TypeScript), no web build

User-facing strings are Korean. The app does not own a place catalog — Google Places API supplies candidates live; the server only keeps a thin per-place annotation cache and per-user visit history (see Architecture below).

**Current development focus: Android only.** iOS is deferred — see *iOS status (deferred)* under Architecture before doing any iOS work.

## Commands

### Backend (run from `backend/`)

```sh
pip install -r requirements.txt
uvicorn app:app --reload --env-file .env   # serves http://localhost:8000, docs at /docs
pytest                                     # scorer unit tests (tests/test_recommendation.py) — no network, no DB
```

Modules use flat top-level imports (`from database import ...`), so the working directory must be `backend/` — there is no package, no `alembic`, no migration path. Tables are created by `Base.metadata.create_all` at import time in `app.py`; schema changes require deleting/recreating `sinchon_guide.db`.

Requires `GOOGLE_MAPS_SERVER_KEY` in the environment (a Google Cloud key with Places API (New) + Routes API enabled, IP-restricted to wherever the backend runs) to actually serve `/recommendations` or `/routes`. Easiest way to provide it locally: create `backend/.env` (gitignored) with `GOOGLE_MAPS_SERVER_KEY=your_key_here` and pass `--env-file .env` to `uvicorn` (uvicorn's built-in dotenv loading, no app code involved). The key is read lazily at call time (not import time) via `services/google_errors.require_api_key()`, so the app still boots and `pytest` still runs without it — missing/invalid keys surface as a clear JSON error (500 if unset, 502 with Google's own message if Google rejects the request) instead of an opaque crash. This key is server-side only and must never be shipped to the client.

### Frontend (run from `frontend/`)

```sh
npm start                         # Metro dev server
npm run android                   # build + run Android emulator
npm run ios                       # iOS simulator — macOS only; cannot run on the Windows dev machine (iOS deferred)
npm run lint                      # eslint
npm test                          # jest
npm test -- --watch App.test.tsx  # single test file
```

`react-native-maps` and `@react-native-async-storage/async-storage`/`@react-native-community/geolocation`'s native modules aren't present under Jest; `jest.config.js` + `jest.setup.js` mock them (`__mocks__/react-native-maps.js`, `jest.setup.js`) so the smoke test can render the tree.

## Architecture

### Backend

- `app.py` mounts four routers: `users`, `recommendations`, `routes`, `visits`.
- Auth: JWT via python-jose (`auth.py`), bcrypt password hashing, 1-week tokens, login endpoint `users/login`. Secret comes from `SINCHON_JWT_SECRET` env var (falls back to a dev default).
- `services/places.py` — the only source of place breadth. Calls Google Places API (New) `searchNearby` around the user's location (~1.2km radius), maps `Need.type` → `includedTypes`. Budget is deliberately **not** sent as a request filter (Nearby Search doesn't reliably support it); it's scored client-side instead. Upserts a `PlaceAnnotation` row per result (thin cache keyed by Google's `place_id` — never a full catalog mirror).
- `services/google_errors.py` — shared helper for both Google call sites (`services/places.py`, `routers/routes.py`): `require_api_key()` raises a clean JSON 500 if `GOOGLE_MAPS_SERVER_KEY` is unset, `request_google_api()` turns any Google-side rejection into a JSON 502 carrying Google's own error message. Without this, misconfiguration (bad key, billing not enabled, wrong IP restriction) is indistinguishable from any other crash — just "HTTP 500" with no detail.
- `services/recommendation.py` — pure scorer, no DB/network. Ranking policy: **closest-first** (walking distance dominates), with rating / budget-fit / per-place visit history as near-tie breakers only; a closed place always ranks below an open one. Tested in `tests/test_recommendation.py`.
- `routers/recommendations.py` — `POST /recommendations` ties the above together: Places candidates + the user's per-place visit counts → scorer → ranked list.
- `routers/routes.py` — `POST /routes` proxies Google Routes API (walking mode) for a single polyline, called only for the place the user actually picked (not for every candidate).
- `routers/visits.py` — `POST /visits`, the only write path for `Visit` rows (recorded when the user commits to being guided somewhere); read back by the scorer as a personalization signal.

### Frontend

- **No navigation library.** `App.tsx` holds a manual `route` state (`'ask' | 'guide'`) and renders `AskScreen`/`GuideScreen` from `src/screens/` conditionally. Auth gating happens in `Root` via `src/auth/AuthContext.tsx` (token persisted with AsyncStorage in `src/api/authStore.ts`); no token → `AuthScreen` directly.
- `AskScreen` — the ≤4-option button flow ("what do you need?"). Produces `Need = {type, budget, lat, lng}` (`src/types/recommendation.ts`) — this is the categorization contract. A future free-text/LLM input stage just needs to emit this same shape; nothing downstream changes.
- `GuideScreen` — fetches the walking route for the picked place, renders `LiveMapView` with the pick marker, the decoded polyline (`src/utils/decodePolyline.ts`), and the native live user-location dot, plus a Google Maps handoff button.
- `src/api/config.ts` picks the API host per platform: Android emulator → `10.0.2.2:8000`, iOS simulator → `localhost:8000`. Physical devices need the machine's LAN IP edited in that file.
- **Current focus: Android only. iOS is deferred** (see *iOS status* below). Android is developed and tested on an Android Studio emulator with a **Google Play Services** system image (native build via `npm run android`); this is the only supported dev/demo target right now.

### Maps

- `src/components/LiveMapView.tsx` wraps `react-native-maps`. `provider={PROVIDER_GOOGLE}` is set **on Android only**; the iOS default (Apple Maps) is left in place for the deferred iOS work (see *iOS status*). Don't re-add `react-native-google-maps`/`GMSServices` wiring on iOS unless/until iOS moves to a custom dev client.
- No OpenStreetMap/tile-overlay dependency.
- **Two separate Google keys, two separate purposes** — don't conflate them:
  - `frontend/.env` (gitignored): `map_api_key_android` (Maps SDK, renders the native map view only). `android/app/build.gradle` reads it and injects it into `AndroidManifest.xml` via a `manifestPlaceholder` (`com.google.android.geo.API_KEY`).
  - Backend env: `GOOGLE_MAPS_SERVER_KEY` (Places API (New) + Routes API — the actual place/route data). Server-side only, read lazily by `services/places.py`/`routers/routes.py`, never shipped to the client.
- The Android emulator's AVD must use a system image with **Google Play Services** (not bare AOSP/plain "Google APIs"), or the map renders blank/gray even with a valid key.

### Google Routes API doesn't work in South Korea (regulatory, not a bug)

`POST /routes` will reliably 404 ("No walking route found") for every real Sinchon origin/destination pair — confirmed by calling `computeRoutes` directly with Sinchon coordinates (HTTP 200, empty `{}` body, no `routes` key) versus the identical request shape with non-Korea coordinates (returns a normal route). This isn't a key, field-mask, or request-format problem.

South Korea's Act on National Spatial Data Infrastructure restricts export of detailed (1:5,000-scale) map data to servers outside the country. Google's routing servers are outside Korea, so Google is legally barred from computing driving/walking routes for Korean locations via the Directions/Routes API — it can return place *search* results (Places API is unaffected) but not turn-by-turn route geometry. Conditional export approval was granted in Feb 2026, but as of this writing it has not produced working API routing.

Practical effect: `routers/routes.py` and `GuideScreen`'s polyline are dormant for this app's actual use case (they work fine in tests/demos against non-Korea coordinates, which is how the original build was verified). If in-app walking routes are needed, the fix is swapping the routing provider for a Korea-legal one (e.g. Tmap's pedestrian-route API, or Kakao/Naver Map SDKs) — Google Places can stay as the breadth source regardless, since only routing is blocked.

### iOS status (deferred)

Out of scope right now — captured here so the constraints aren't rediscovered later. Despite the branch being named `expo`, **no Expo tooling is installed** (this is bare React Native CLI). The Windows dev machine has **no iOS Simulator** (requires macOS/Xcode), so iOS needs a physical device or a Mac. Two possible paths, each with trade-offs:

- **Stock Expo Go on a physical iPhone** — a fixed prebuilt binary that runs the JS bundle but **cannot load custom native pods**. Only modules Expo Go already ships work: `react-native-maps` ✅, `react-native-safe-area-context` ✅, `@react-native-async-storage/async-storage` ✅ — but **`@react-native-community/geolocation` ✗** (Expo ships `expo-location` instead), so device location breaks, and maps fall back to Apple Maps (no Google Maps iOS SDK pod).
- **Custom dev client via EAS Build** — cloud macOS build, no local Mac required; supports all native modules (geolocation, Google Maps iOS SDK) but needs EAS setup and a physical device.

Google's web-service APIs (Places, Routes) are plain HTTPS `fetch` calls from the **backend**, not native modules on the client — so they work regardless of which iOS path is chosen, once iOS is picked back up.

### Android native build (Windows)

- New Architecture is on (`newArchEnabled=true`), so every native module gets a Fabric codegen C++ target compiled via CMake/Ninja. CMake mirrors each source file's full absolute path under the build directory, which on Windows can blow past the 260-character `MAX_PATH` limit — this repo's own path (`...\Private Files\Programming\sinchon_guide\frontend\node_modules\...`) is long enough to trigger it (hit first on `react-native-safe-area-context`).
- `android/app/build.gradle` sets `externalNativeBuild.cmake.buildStagingDirectory` to a short temp-dir path to shave the build-dir prefix, but that alone isn't sufficient — the mirrored `node_modules` source path is the bigger contributor. The real fix is enabling Windows long-path support (`LongPathsEnabled=1` registry key + `git config --system core.longpaths true`, needs a reboot) or moving the project to a short path. If a `Filename longer than 260 characters` Ninja error resurfaces after adding a new native dependency, this is why.
