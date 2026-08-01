import { useEffect, useState } from 'react';
import {
  DEFAULT_COORDINATE,
  MapCoordinate,
  requestCurrentLocation,
  watchPosition,
} from '../services/locationService';

type State = {
  center: MapCoordinate;
  loading: boolean;
};

export function useUserLocation() {
  const [state, setState] = useState<State>({
    center: DEFAULT_COORDINATE,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    let unwatch: (() => void) | null = null;

    requestCurrentLocation()
      .then(result => {
        if (!active) {
          return;
        }

        setState({
          center: result.coordinate,
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
      })
      // Defensive backstop: requestCurrentLocation is documented to always
      // resolve (never reject), but if a future regression in the service
      // layer breaks that contract, don't leave `loading` stuck at true —
      // fall back the same way a denied permission does.
      .catch(() => {
        if (active) {
          setState({
            center: DEFAULT_COORDINATE,
            loading: false,
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
