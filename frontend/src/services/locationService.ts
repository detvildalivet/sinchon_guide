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
    ).then(result => {
      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        readPosition();
        return;
      }

      finish({
        status: 'denied',
        coordinate: DEFAULT_COORDINATE,
      });
    });
  });
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
