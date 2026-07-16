import * as Location from 'expo-location';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type MapRegion = MapCoordinate & {
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Fallback when permission is denied — 강남역 인근 */
export const DEFAULT_COORDINATE: MapCoordinate = {
  latitude: 37.4979,
  longitude: 127.0276,
};

export const DEFAULT_REGION: MapRegion = {
  ...DEFAULT_COORDINATE,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

export type LocationResult =
  | { status: 'granted'; coordinate: MapCoordinate }
  | { status: 'denied'; coordinate: MapCoordinate };

export async function requestCurrentLocation(): Promise<LocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { status: 'denied', coordinate: DEFAULT_COORDINATE };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      status: 'granted',
      coordinate: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    };
  } catch {
    return { status: 'denied', coordinate: DEFAULT_COORDINATE };
  }
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
  latitudeDelta = 0.012,
  longitudeDelta = 0.012,
): MapRegion {
  return {
    ...coordinate,
    latitudeDelta,
    longitudeDelta,
  };
}
