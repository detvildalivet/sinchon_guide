# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sinchon Guide (frontend app name: **Sinchon Guide**, package `com.sinchonguide`) — a place-recommendation app for the Sinchon area. One linear pipeline: **ask what the user needs → categorize the answer → recommend a real nearby place → guide them there.** Two independent apps in one repo:

- `backend/` — FastAPI + SQLAlchemy + SQLite (`sinchon_guide.db`)
- `frontend/` — React Native 0.85 (TypeScript), no web build

User-facing strings are Korean. The app does not own a place catalog — Kakao Local API supplies candidates live; the server only keeps a thin per-place annotation cache and per-user visit history (see Architecture below). (Google Places was the original source; fully removed — see *Place search: Kakao Local API* below.)

**Current development focus: Android only.** iOS is deferred — see *iOS status (deferred)* under Architecture before doing any iOS work.

## Commands

### Backend (run from `backend/`)

```sh
pip install -r requirements.txt
uvicorn app:app --reload --env-file .env   # serves http://localhost:8000, docs at /docs
pytest                                     # unit tests (tests/test_recommendation.py — scorer; tests/test_places.py — need-type filter) — no network, no DB
```

Modules use flat top-level imports (`from database import ...`), so the working directory must be `backend/` — there is no package, no `alembic`, no migration path. Tables are created by `Base.metadata.create_all` at import time in `app.py`; schema changes require deleting/recreating `sinchon_guide.db`.

Requires two env vars to actually serve `/recommendations` and `/routes`: `KAKAO_REST_API_KEY` (Kakao Developers REST API key — not the JavaScript or Native App key — for place search) and `TMAP_APP_KEY` (SK Open API key, Pedestrian product, for walking routes). Easiest way to provide them locally: create `backend/.env` (gitignored) with both vars set and pass `--env-file .env` to `uvicorn` (uvicorn's built-in dotenv loading, no app code involved). Both are read lazily at call time (not import time) via `services/api_errors.require_kakao_key()`/`require_tmap_key()`, so the app still boots and `pytest` still runs without them — missing/invalid keys surface as a clear JSON error (500 if unset, 502 with the provider's own message if it rejects the request) instead of an opaque crash. These keys are server-side only and must never be shipped to the client. (An earlier Google Cloud key used to live here too — repeatedly broke on IP changes since it was IP-restricted; if you set an IP allowlist on the Kakao/TMAP keys, remember the same lesson applies.)

### Frontend (run from `frontend/`)

```sh
npm start                         # Metro dev server
npm run android                   # build + run Android emulator
npm run ios                       # iOS simulator — macOS only; cannot run on the Windows dev machine (iOS deferred)
npm run lint                      # eslint
npm test                          # jest
npm test -- --watch App.test.tsx  # single test file
```

`@mj-studio/react-native-naver-map` and `@react-native-async-storage/async-storage`/`@react-native-community/geolocation`'s native modules aren't present under Jest; `jest.config.js` + `jest.setup.js` mock them (`__mocks__/@mj-studio/react-native-naver-map.js`, `jest.setup.js`) so the smoke test can render the tree.

## Architecture

### Backend

- `app.py` mounts four routers: `users`, `recommendations`, `routes`, `visits`.
- Auth: JWT via python-jose (`auth.py`), bcrypt password hashing, 1-week tokens, login endpoint `users/login`. Secret comes from `SINCHON_JWT_SECRET` env var (falls back to a dev default).
- `services/places.py` — the only source of place breadth. Calls **Kakao Local API** around the user's location (~1.2km radius): the category-search endpoint for `meal`/`cafe` (clean `category_group_code` buckets, FD6/CE7), the keyword-search endpoint for `drinks`/`dessert` (Kakao has no dedicated category code for bars or dessert shops — they're subcategories of FD6/CE7, so a keyword like "술집"/"디저트" narrows within the group). Budget is **not sent at all** — Kakao has no price-level concept, request-side or otherwise (see *Place search: Kakao Local API* below for why). Results are post-filtered by `_matches_need_type` against Kakao's `category_name` breadcrumb string (tested in `tests/test_places.py`) — same defensive purpose as the old Google-era check (a broad category bucket can include things that don't belong, e.g. a cafe surfacing under a `meal` search). Upserts a `PlaceAnnotation` row per surviving result (thin cache keyed by Kakao's `place_id` — never a full catalog mirror).
- `services/api_errors.py` — shared helper for both external call sites (`services/places.py` → Kakao, `routers/routes.py` → TMAP): `require_kakao_key()`/`require_tmap_key()` raise a clean JSON 500 if the respective env var is unset, `request_external_api()` turns any upstream rejection into a JSON 502 carrying the provider's own error message. Without this, misconfiguration (bad key, wrong IP restriction, wrong TMAP product subscribed) is indistinguishable from any other crash — just "HTTP 500" with no detail. (Was `google_errors.py`/`require_api_key()`/`request_google_api()` — renamed once Google Places was removed and zero Google traffic remained.)
- `services/recommendation.py` — pure scorer, no DB/network. Ranking policy: **closest-first** (walking distance dominates); rating and budget-fit are near-tie breakers **in name only right now** — neither Kakao nor Naver expose rating/price-level/open-now data via public API, so `rating`/`price_level`/`open_now` are always `None` on every candidate, and the scorer's existing `Optional`-safe handling (`_budget_fit(None, _) → 0.5` neutral, `open_now is False` never fires on `None`) quietly reduces ranking to closest-first + per-place visit-history. The logic is kept as-is (not deleted) in case a future data source ever supplies this again. Tested in `tests/test_recommendation.py`.
- `routers/recommendations.py` — `POST /recommendations` ties the above together: Kakao Local candidates + the user's per-place visit counts → scorer → ranked list.
- `routers/routes.py` — `POST /routes` proxies **TMAP's Pedestrian Route API** (walking mode) for the walking-path coordinates + distance, called only for the place the user actually picked (not for every candidate). Google Routes was tried first but is legally blocked for Korean coordinates (see *Routing in South Korea* below); TMAP is a Korea-based provider and isn't subject to that restriction. The pure transform from TMAP's GeoJSON response to `RouteOut` lives in `tmap_geojson_to_route()`, tested in `tests/test_routes.py`.
- `routers/visits.py` — `POST /visits`, the only write path for `Visit` rows. Written best-effort (fire-and-forget, never blocks navigation) from `GuideScreen`'s Naver Map handoff button; read back by the scorer as a personalization signal.

### Frontend

- **No navigation library.** `App.tsx` holds a manual `route` state (`'ask' | 'guide'`) and renders `AskScreen`/`GuideScreen` from `src/screens/` conditionally. Auth gating happens in `Root` via `src/auth/AuthContext.tsx` (token persisted with AsyncStorage in `src/api/authStore.ts`); no token → `AuthScreen` directly.
- `AskScreen` — a 2-step button flow: `type → result` (≤4 options). Picking a need type calls `/recommendations` immediately and caches the ranked candidate list; "다시 보기" (reroll) walks that cached list client-side instead of refetching. **No budget step** — it was dropped (not just hidden) once Places moved to Kakao, since no Korean provider exposes price-level/menu data via public API, so budget can no longer affect ranking (see `services/recommendation.py` above). `Need.budget` stays in the wire contract with a constant `'mid'` value (still recorded on `Visit`, forward-compatible if a data source ever revives it) — only the UI question is gone. Produces `Need = {type, budget, lat, lng}` (`src/types/recommendation.ts`) — this is the categorization contract. A future free-text/LLM input stage just needs to emit this same shape; nothing downstream changes.
- `GuideScreen` — fetches the walking route for the picked place, renders `LiveMapView` with the pick marker, the route as a `NaverMapPathOverlay` (coordinates come straight from `POST /routes`, no decoding needed), and the live user-location dot, plus a "네이버 지도로 안내" handoff button that fires `POST /visits` best-effort before opening Naver Map's walking-directions deep link (`nmap://route/walk?...`, falling back to the Play Store listing if not installed).
- `src/hooks/useUserLocation.ts` + `src/services/locationService.ts` — the location source for both screens' `Need.lat/lng` and map regions. Falls back to a fixed Sinchon-station coordinate when permission is denied/unavailable (never some other neighborhood, since that would silently mis-locate every downstream Places search); `regionCovering()` computes the smallest region framing two coordinates (user + destination) without needing a `MapView` ref. Also runs a continuous `watchPosition` once the initial fix is granted, since (unlike `react-native-maps`) Naver's location overlay has no GPS tracking of its own — the app must keep feeding it a fresh coordinate for the live dot to actually move.
- `src/design/` — the shared style/token layer (`theme.ts` colors/spacing/radius/typography/shadow; `shellStyles.ts` panel/prompt-card shells; `layout.ts` screen scaffolding). `src/components/` holds the presentational/animation primitives built on it (`AppButton`, `IconButton`, `TouchableFade`, `MapMarkerPin`, `BottomActionBar`, `PhaseIndicator`, `AnimatedHint`, `ScreenTransition`, `CardTransition`, `CrossfadeSwitch`) — screens compose these rather than styling inline.
- `src/api/config.ts` picks the API host per platform: Android emulator → `10.0.2.2:8000`, iOS simulator → `localhost:8000`. Physical devices need the machine's LAN IP edited in that file.
- **Current focus: Android only. iOS is deferred** (see *iOS status* below). Android is developed and tested on an Android Studio emulator with a Google Play Services system image (native build via `npm run android`; see *Maps and place search* below for why that system image is still recommended even though Google is no longer the map/place provider) — this is the only supported dev/demo target right now.

### Maps and place search — fully off Google now

Google is gone from this app entirely: map rendering moved to Naver, routing moved to TMAP, and
place search moved to Kakao (this section covers all three; see *Place search: Kakao Local API*
below for the place-search migration specifically, and *Routing in South Korea* for TMAP).

**What each API actually does — each owns exactly one stage, no overlap:**
- **Kakao Local API** (backend, `KAKAO_REST_API_KEY`) — finds *what's nearby*. Given the user's
  location + need type, returns real businesses (name, coordinates, category) within ~1.2km.
  This is the candidate data `services/recommendation.py` ranks. Called from `services/places.py`.
- **TMAP Pedestrian Route API** (backend, `TMAP_APP_KEY`) — computes *how to walk there*. Given
  a start/end coordinate pair (only for the place the user actually picked), returns the walking
  path geometry + distance/time. Called from `routers/routes.py`.
- **Naver Maps SDK** (frontend, `naver_map_client_id`) — *draws it all on screen*: the map tiles,
  the live user-location dot, the destination pin, and the TMAP-supplied route line. Purely
  client-side rendering — it doesn't search for places or compute routes itself.

- `src/components/LiveMapView.tsx` wraps `@mj-studio/react-native-naver-map` (`NaverMapView`), replacing `react-native-maps`/Google as the map renderer — Android only for now (see *iOS status*); the JS is platform-agnostic so iOS just needs its native Naver setup added later. `MapMarkerPin` wraps `NaverMapMarkerOverlay`; `GuideScreen`'s route line is a `NaverMapPathOverlay`. **`MapMarkerPin` requires explicit `width`/`height` props** (matching its child `View`'s own size, e.g. `GuideScreen`'s `PIN_SIZE` constant) — a custom-`View` marker (as opposed to an image marker) has no intrinsic size for the native side to measure, and `NaverMapMarkerOverlay` silently renders nothing at all for it without an explicit size, rather than falling back to a default. This bit us once already (destination pin missing while the route line rendered fine) — if a pin silently stops appearing after touching `MapMarkerPin`, check this first.
- No OpenStreetMap/tile-overlay dependency.
- **Three fully independent keys/credentials, three unrelated providers** — don't conflate them:
  - `frontend/.env` (gitignored): `naver_map_client_id` — Naver Cloud Platform (NCP) Maps client ID, renders the native map view only. **One client ID covers both platforms** (the NCP application is registered with both an Android package name and an iOS bundle ID) — no `_android`/`_ios` suffix needed. `android/app/build.gradle` reads it and injects it into `AndroidManifest.xml` via a `manifestPlaceholder` (`com.naver.maps.map.NCP_KEY_ID`); iOS wiring (Info.plist) is added when iOS work resumes. Requires the Naver Maven repo (`https://repository.map.naver.com/archive/maven`) added to `android/build.gradle`.
  - Backend env: `TMAP_APP_KEY` (SK Open API — TMAP Pedestrian Route API, the walking-path data for `routers/routes.py`). Server-side only, read lazily via `services/api_errors.require_tmap_key()`. The app registered for this key must have the **보행자 경로안내 (Pedestrian)** product subscribed — a **TMAP 대중교통 (Transit)**-only key will not authorize this endpoint.
  - Backend env: `KAKAO_REST_API_KEY` (Kakao Developers — Local API, the place-search data for `services/places.py`). Server-side only, read lazily via `services/api_errors.require_kakao_key()`. Use the app's **REST API key**, not its JavaScript or Native App key — those are for client-side/native SDK auth, not server calls.
- The Android emulator's AVD historically needed a **Google Play Services** system image for the Google Maps SDK to render; that specific reason is gone now that rendering is Naver, but Play Services still benefits `@react-native-community/geolocation`'s location accuracy, so keep using a Play-Services image unless you have a specific reason not to.
- `Linking.canOpenURL('nmap://...')` (used by `GuideScreen`'s handoff button) requires a `<queries>` entry for the `nmap` scheme in `AndroidManifest.xml` — Android 11+ package-visibility rules make it silently return `false` otherwise, even with Naver Map installed.

### Place search: Kakao Local API (Google Places removed)

Google Places was the last remaining Google dependency (map rendering and routing had already
moved to Naver/TMAP) and kept causing the exact failure `googleghost.png` shows: a 403 because
`GOOGLE_MAPS_SERVER_KEY` was IP-restricted and the dev machine's IP had changed.

Naver was investigated as a replacement and ruled out: NCP's Maps product family (the same
console `naver_map_client_id` comes from) has exactly five products — Dynamic Map, Static Map,
Directions 5/15, Geocoding, Reverse Geocoding — no place/POI search API at all. Naver's Local
Search API (`openapi.naver.com`, a *different* Naver platform than NCP) is keyword-only text
search, capped at 5 results, with no coordinate/radius parameter — a poor fit for
"closest-first, radius-bounded" search. No official Naver API exposes menu/price data either
(the menu/price shown in the consumer Naver Map app is SmartPlace business-listing data with no
public REST endpoint).

**Fix applied:** `services/places.py` now calls **Kakao's Local API** — `category.json` for
`meal`/`cafe` (clean `category_group_code` buckets), `keyword.json` for `drinks`/`dessert`
(Kakao has no dedicated category code for bars/dessert shops — see the bullet above). Same
1.2km radius, same defensive category post-filter pattern as the Google-era code. **Neither
Kakao nor Naver expose rating/price-level/open-now** — see `services/recommendation.py`'s bullet
above for how the scorer degrades gracefully, and the `AskScreen` bullet for why the budget
step was dropped from the UI as a consequence.

### Routing in South Korea: Google Routes doesn't work, TMAP does

Google Routes' `computeRoutes` reliably 404s ("No walking route found") for every real Sinchon origin/destination pair — confirmed by calling it directly with Sinchon coordinates (HTTP 200, empty `{}` body, no `routes` key) versus the identical request shape with non-Korea coordinates (returns a normal route). This isn't a key, field-mask, or request-format problem: South Korea's Act on National Spatial Data Infrastructure restricts export of detailed (1:5,000-scale) map data to servers outside the country, and Google's routing servers are outside Korea. Google can still return place *search* results (Places API is unaffected) but not turn-by-turn route geometry. Conditional export approval was granted in Feb 2026, but as of this writing it has not produced working API routing.

**Fix applied:** `routers/routes.py` now calls **TMAP's Pedestrian Route API** (`apis.openapi.sk.com/tmap/routes/pedestrian`) instead — TMAP is a Korea-based provider and isn't subject to the export restriction. The response (GeoJSON `LineString`/`Point` features) is transformed by the pure `tmap_geojson_to_route()` into `RouteOut.coordinates`, a plain `{latitude, longitude}` list that feeds `NaverMapPathOverlay` directly (no polyline encode/decode round trip — that machinery was removed along with `react-native-maps`). The in-app map render also moved to Naver Map for the same underlying reason (see *Maps* above), and `GuideScreen`'s external handoff button now opens Naver Map's walking-directions deep link instead of Google Maps.

### iOS status (deferred)

Out of scope right now — captured here so the constraints aren't rediscovered later. Despite the branch being named `expo`, **no Expo tooling is installed** (this is bare React Native CLI). The Windows dev machine has **no iOS Simulator** (requires macOS/Xcode), so iOS needs a physical device or a Mac. Two possible paths, each with trade-offs:

- **Stock Expo Go on a physical iPhone** — a fixed prebuilt binary that runs the JS bundle but **cannot load custom native pods**. Only modules Expo Go already ships work: `react-native-safe-area-context` ✅, `@react-native-async-storage/async-storage` ✅ — but **`@react-native-community/geolocation` ✗** (Expo ships `expo-location` instead) and **`@mj-studio/react-native-naver-map` ✗** (not an Expo Go built-in; it does ship an Expo config-plugin for prebuild, but that only helps the *next* path, not stock Expo Go). So on this path the map wouldn't render at all, not just fall back to Apple Maps — this path is effectively closed now that the renderer is Naver, not `react-native-maps`.
- **Custom dev client via EAS Build** — cloud macOS build, no local Mac required; supports all native modules (geolocation, Naver Map's iOS SDK via its Expo config-plugin or manual Podfile wiring) but needs EAS setup and a physical device. This is now the only realistic iOS path.

The backend's web-service APIs (Kakao Local, TMAP Routes) are plain HTTPS `fetch` calls from the **backend**, not native modules on the client — so they work regardless of which iOS path is chosen, once iOS is picked back up.

### Android native build (Windows)

- New Architecture is on (`newArchEnabled=true` in `android/gradle.properties`), so every native module gets a Fabric codegen C++ target compiled via CMake/Ninja. **Do not set this to `false`** — RN 0.85's app-level build runs the Fabric/CMake configure step unconditionally regardless of this flag, but a third-party library's own `build.gradle` (e.g. `@mj-studio/react-native-naver-map`'s) typically gates *its own* codegen generation behind this same property. Flip it to `false` and the app still tries to `add_subdirectory` into that library's (now never-generated) `.../android/build/generated/source/codegen/jni/`, which fails CMake configure with "which is not an existing directory" — this is exactly what happened on this branch (commit `abb258e`, "I can't deal with the guidance issue", turned it off as a workaround attempt and never turned it back on) and cost real time to root-cause. If you hit that CMake error after adding a native dependency, check this flag first. CMake also mirrors each source file's full absolute path under the build directory, which on Windows can blow past the 260-character `MAX_PATH` limit — this repo's own path (`...\Private Files\Programming\sinchon_guide\frontend\node_modules\...`) is long enough to trigger it (hit first on `react-native-safe-area-context`).
- `android/app/build.gradle` sets `externalNativeBuild.cmake.buildStagingDirectory` to a short temp-dir path to shave the build-dir prefix, but that alone isn't sufficient — the mirrored `node_modules` source path is the bigger contributor. The real fix is enabling Windows long-path support (`LongPathsEnabled=1` registry key + `git config --system core.longpaths true`, needs a reboot) or moving the project to a short path. If a `Filename longer than 260 characters` Ninja error resurfaces after adding a new native dependency, this is why.
