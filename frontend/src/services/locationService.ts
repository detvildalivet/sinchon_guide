import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type MapRegion = MapCoordinate & {
  latitudeDelta: number;
  longitudeDelta: number;
};

/**
 * Fallback when location permission is denied or unavailable (e.g. an
 * emulator with no mock location set) — 신촌역 인근. This app is scoped to
 * Sinchon specifically, so the fallback must land there, not some other
 * neighborhood — a wrong fallback here silently sends every downstream
 * Places search (and map region) to the wrong part of the city.
 */
export const DEFAULT_COORDINATE: MapCoordinate = {
  latitude: 37.5596,
  longitude: 126.9368,
};

/**
 * Dev-only location override. The Android emulator's default GPS fix is
 * Google HQ in Mountain View, California — and since that's a *granted*
 * position (not a denied/unavailable one), requestCurrentLocation() would
 * otherwise return it as-is and send the whole app (recommendations, routes,
 * map) to the wrong continent. Pin to Yonsei University's main gate
 * (southern entrance) instead so local dev/demo always starts in Sinchon.
 * Flip this to false to use the device/emulator's real GPS again.
 */
const USE_MOCK_LOCATION = __DEV__;
export const MOCK_COORDINATE: MapCoordinate = {
  latitude: 37.5585,
  longitude: 126.937,
};

// ~2.2km across — comfortably frames the backend's 1.2km search radius
// around a single point without zooming in so tight that neighboring pins
// would sit off-screen.
const DEFAULT_ZOOM_DELTA = 0.02;

export const DEFAULT_REGION: MapRegion = {
  ...DEFAULT_COORDINATE,
  latitudeDelta: DEFAULT_ZOOM_DELTA,
  longitudeDelta: DEFAULT_ZOOM_DELTA,
};

export type LocationResult =
  | { status: 'granted'; coordinate: MapCoordinate }
  | { status: 'denied'; coordinate: MapCoordinate };

export function requestCurrentLocation(): Promise<LocationResult> {
  return new Promise(resolve => {
    if (USE_MOCK_LOCATION) {
      resolve({ status: 'granted', coordinate: MOCK_COORDINATE });
      return;
    }

    const finish = (result: LocationResult) => resolve(result);

    const readPosition = () => {
      Geolocation.getCurrentPosition(
        position => {
          finish({
            status: 'granted',
            coordinate: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
        },
        () => {
          finish({
            status: 'denied',
            coordinate: DEFAULT_COORDINATE,
          });
        },
        {
          enableHighAccuracy: Platform.OS === 'ios',
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    };

    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization?.();
      readPosition();
      return;
    }

    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    )
      .then(result => {
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          readPosition();
          return;
        }

        finish({
          status: 'denied',
          coordinate: DEFAULT_COORDINATE,
        });
      })
      // A thrown/rejected permission request (rather than a granted/denied
      // result) previously left this Promise unsettled forever, which
      // stranded useUserLocation's `loading` at true and produced a
      // permanent spinner. Fall back the same way an explicit denial does.
      .catch(() => {
        finish({
          status: 'denied',
          coordinate: DEFAULT_COORDINATE,
        });
      });
  });
}

/**
 * Naver's location overlay (the live user dot) has no built-in GPS tracking
 * of its own — unlike react-native-maps' `showsUserLocation`, the app must
 * keep feeding it a fresh coordinate. Returns an unsubscribe function.
 */
export function watchPosition(
  onUpdate: (coordinate: MapCoordinate) => void,
): () => void {
  if (USE_MOCK_LOCATION) {
    onUpdate(MOCK_COORDINATE);
    return () => {};
  }

  const watchId = Geolocation.watchPosition(
    position => {
      onUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    () => {
      // Best-effort live tracking; keep showing the last known/fallback
      // position rather than clearing it on a transient watch error.
    },
    { enableHighAccuracy: Platform.OS === 'ios', distanceFilter: 5 },
  );

  return () => Geolocation.clearWatch(watchId);
}

export function offsetCoordinate(
  origin: MapCoordinate,
  metersNorth: number,
  metersEast: number,
): MapCoordinate {
  const latitude = origin.latitude + metersNorth / 111_320;
  const longitude =
    origin.longitude +
    metersEast / (111_320 * Math.cos((origin.latitude * Math.PI) / 180));

  return { latitude, longitude };
}

export function regionAround(
  coordinate: MapCoordinate,
  latitudeDelta = DEFAULT_ZOOM_DELTA,
  longitudeDelta = DEFAULT_ZOOM_DELTA,
): MapRegion {
  return {
    ...coordinate,
    latitudeDelta,
    longitudeDelta,
  };
}

/**
 * Smallest region that frames both coordinates (e.g. the user and a guided
 * destination), with padding so neither pin sits flush against the edge.
 * Used instead of a MapView ref so LiveMapView doesn't need an imperative API.
 */
export function regionCovering(
  a: MapCoordinate,
  b: MapCoordinate,
  padding = 1.8,
): MapRegion {
  const minLat = Math.min(a.latitude, b.latitude);
  const maxLat = Math.max(a.latitude, b.latitude);
  const minLng = Math.min(a.longitude, b.longitude);
  const maxLng = Math.max(a.longitude, b.longitude);

  const MIN_DELTA = 0.006;
  const latitudeDelta = Math.max((maxLat - minLat) * padding, MIN_DELTA);
  const longitudeDelta = Math.max((maxLng - minLng) * padding, MIN_DELTA);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}
