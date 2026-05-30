import { useEffect, useState } from 'react';
import {
  DEFAULT_COORDINATE,
  MapCoordinate,
  MapRegion,
  regionAround,
  requestCurrentLocation,
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
    });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
