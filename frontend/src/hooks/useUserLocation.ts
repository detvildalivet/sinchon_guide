import { useEffect, useState } from 'react';
import {
  DEFAULT_COORDINATE,
  MapCoordinate,
  MapRegion,
  regionAround,
  requestCurrentLocation,
  watchPosition,
} from '../services/locationService';

type State = {
  region: MapRegion;
  center: MapCoordinate;
  usingFallback: boolean;
  loading: boolean;
};

export function useUserLocation() {
  const [state, setState] = useState<State>({
    region: regionAround(DEFAULT_COORDINATE),
    center: DEFAULT_COORDINATE,
    usingFallback: true,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    let unwatch: (() => void) | null = null;

    requestCurrentLocation().then(result => {
      if (!active) {
        return;
      }

      setState({
        region: regionAround(result.coordinate),
        center: result.coordinate,
        usingFallback: result.status === 'denied',
        loading: false,
      });

      // Naver's location overlay has no GPS tracking of its own (unlike
      // react-native-maps' showsUserLocation) — keep `center` fresh so the
      // live user dot actually moves. Skip if permission was denied; the
      // fallback coordinate is static anyway.
      if (result.status === 'granted') {
        unwatch = watchPosition(coordinate => {
          if (active) {
            setState(prev => ({ ...prev, center: coordinate }));
          }
        });
      }
    });

    return () => {
      active = false;
      unwatch?.();
    };
  }, []);

  return state;
}
