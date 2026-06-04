import { useEffect, useState } from 'react';
import { fetchPlaces } from '../api/client';
import { PlacePin } from '../components/FloatingPlacePins';
import { DEFAULT_PIN_LAYOUT, placeLayout } from '../design/placeLayout';
import { VenueCategory } from '../types/tablemate';

type State = {
  places: PlacePin[];
  loading: boolean;
  error: string | null;
};

export function usePlaces(category: VenueCategory): State {
  const [state, setState] = useState<State>({
    places: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    setState({ places: [], loading: true, error: null });

    fetchPlaces(category)
      .then(apiPlaces => {
        if (!active) {
          return;
        }
        const places: PlacePin[] = apiPlaces.map(p => {
          const slug = p.slug ?? String(p.id);
          const layout = placeLayout[slug] ?? DEFAULT_PIN_LAYOUT;
          return {
            id: slug,
            name: p.name,
            meta: p.meta ?? '',
            note: p.note ?? '',
            menu: p.menu ?? [],
            top: layout.top,
            left: layout.left,
          };
        });
        setState({ places, loading: false, error: null });
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
  }, [category]);

  return state;
}
