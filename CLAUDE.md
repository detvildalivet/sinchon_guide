# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sinchon Guide (frontend app name: **Sinchon Guide**, package `com.sinchonguide`) — a place-recommendation and people-matching app for the Sinchon area. Two independent apps in one repo:

- `backend/` — FastAPI + SQLAlchemy + SQLite (`sinchon_guide.db`)
- `frontend/` — React Native 0.85 (TypeScript), no web build

User-facing strings and seed data are Korean.

## Commands

### Backend (run from `backend/`)

```sh
pip install -r requirements.txt
uvicorn app:app --reload          # serves http://localhost:8000, docs at /docs
python seed.py                    # one-time seed: 9 places + 8 menu items
```

Modules use flat top-level imports (`from database import ...`), so the working directory must be `backend/` — there is no package, no `alembic`, no tests. Tables are created by `Base.metadata.create_all` at import time in `app.py`; schema changes require deleting/recreating `sinchon_guide.db` (or manual migration).

### Frontend (run from `frontend/`)

```sh
npm start                         # Metro dev server
npm run android                   # build + run Android emulator
npm run ios                       # build + run iOS simulator (iPhone 17 Pro)
npm run lint                      # eslint
npm test                          # jest
npm test -- --watch App.test.tsx  # single test file
```

## Architecture

### Backend

- `app.py` mounts five routers: `users`, `places`, `visits`, `queues`, `recommendations`.
- Auth: JWT via python-jose (`auth.py`), bcrypt password hashing, 1-week tokens, login endpoint `users/login`. Secret comes from `SINCHON_JWT_SECRET` env var (falls back to a dev default).
- `routers/queues.py` implements real-time queue chat over WebSocket at `/queues/{queue_id}/ws`, tracked by an **in-memory** `ConnectionManager` (state lost on restart, single-process only), plus a REST fallback endpoint for sending messages.

### Frontend

- **No navigation library.** `App.tsx` holds a manual `route` state (`'home' | 'preference' | 'queue' | 'profile'`) and renders screens from `src/screens/` conditionally. Auth gating happens in `Root` via `src/auth/AuthContext.tsx` (token persisted with AsyncStorage in `src/api/authStore.ts`).
- `src/api/config.ts` picks the API host per platform: Android emulator → `10.0.2.2:8000`, iOS simulator → `localhost:8000`. Physical devices need the machine's LAN IP edited in that file.
- **Real test devices differ per platform**: Android is tested on an Android Studio emulator (native build via `npm run android`); iOS is tested through the **stock Expo Go app** on a physical iPhone, even though this is a bare React Native CLI project with no Expo tooling installed. Stock Expo Go is a fixed prebuilt binary — it cannot load custom native pods. This constrains any native-module decision on iOS (see Maps below).

### Maps

- `src/components/LiveMapView.tsx` wraps `react-native-maps`. `provider={PROVIDER_GOOGLE}` is set **on Android only**; iOS is left on the default (Apple Maps), because stock Expo Go can't load the Google Maps iOS SDK pod. Don't re-add `react-native-google-maps`/`GMSServices` wiring on iOS unless the iOS test workflow moves off stock Expo Go (e.g. a custom `expo-dev-client` build).
- No OpenStreetMap/tile-overlay dependency — removed in favor of native map providers.
- API keys live in `frontend/.env` (gitignored): `map_api_key_android`, `map_api_key_ios` (iOS key currently unused/reserved). `android/app/build.gradle` reads `../.env` directly (`map_api_key_android`) and injects it into `AndroidManifest.xml` via a `manifestPlaceholder` (`com.google.android.geo.API_KEY`) — `.env` is the single source of truth; don't reintroduce a separate `local.properties` copy.
- The Android emulator's AVD must use a system image with **Google Play Services** (not bare AOSP/plain "Google APIs"), or the map renders blank/gray even with a valid key.

### Android native build (Windows)

- New Architecture is on (`newArchEnabled=true`), so every native module gets a Fabric codegen C++ target compiled via CMake/Ninja. CMake mirrors each source file's full absolute path under the build directory, which on Windows can blow past the 260-character `MAX_PATH` limit — this repo's own path (`...\Private Files\Programming\sinchon_guide\frontend\node_modules\...`) is long enough to trigger it (hit first on `react-native-safe-area-context`).
- `android/app/build.gradle` sets `externalNativeBuild.cmake.buildStagingDirectory` to a short temp-dir path to shave the build-dir prefix, but that alone isn't sufficient — the mirrored `node_modules` source path is the bigger contributor. The real fix is enabling Windows long-path support (`LongPathsEnabled=1` registry key + `git config --system core.longpaths true`, needs a reboot) or moving the project to a short path. If a `Filename longer than 260 characters` Ninja error resurfaces after adding a new native dependency, this is why.

### Cross-cutting: duplicated recommendation logic

`backend/services/recommendation.py` is a **verbatim port** of `frontend/src/logic/soloMenuRecommendation.ts` — both must produce identical rankings. If you change scoring in one, change the other identically. The frontend passes its local `hour` to the API to avoid server-timezone drift.

Similarly, `backend/seed.py` mirrors the data hardcoded in `frontend/src/components/FloatingPlacePins.tsx` and `soloMenuRecommendation.ts`; keep them consistent (place slugs like `r1`/`c1`/`b1` are the join key via `Place.slug`).
