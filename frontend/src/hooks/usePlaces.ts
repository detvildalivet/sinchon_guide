import { useEffect, useState } from 'react';
import { fetchNearbyPlaces } from '../api/client';
import { ApiNearbyPlace } from '../api/types';
import { MapCoordinate } from '../services/locationService';
import { PlacePin, VenueCategory } from '../types/tablemate';

type State = {
  places: PlacePin[];
  loading: boolean;
  error: string | null;
};

const categoryLabels: Record<VenueCategory, string> = {
  restaurant: '음식점',
  cafe: '카페',
  bar: '술집',
};

function toPin(p: ApiNearbyPlace): PlacePin {
  const ratingLabel = p.rating != null ? `${p.rating.toFixed(1)}★` : null;
  const meta = [ratingLabel, categoryLabels[p.placeType]]
    .filter(Boolean)
    .join(' · ');
  return {
    id: p.googlePlaceId,
    name: p.name,
    meta,
    note: p.address ?? '',
    menu: [],
    latitude: p.latitude,
    longitude: p.longitude,
  };
}

export function usePlaces(
  category: VenueCategory,
  center: MapCoordinate,
): State {
  const [state, setState] = useState<State>({
    places: [],
    loading: true,
    error: null,
  });

  const { latitude, longitude } = center;

  useEffect(() => {
    let active = true;
    setState({ places: [], loading: true, error: null });

    fetchNearbyPlaces(category, latitude, longitude)
      .then(apiPlaces => {
        if (!active) {
          return;
        }
        setState({ places: apiPlaces.map(toPin), loading: false, error: null });
      })
      .catch(e => {
        if (active) {
          setState({
            places: [],
            loading: false,
            error: e instanceof Error ? e.message : 'failed to load places',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [category, latitude, longitude]);

  return state;
}
