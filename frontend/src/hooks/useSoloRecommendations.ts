import { useEffect, useState } from 'react';
import { fetchSoloRecommendations } from '../api/client';
import { SoloMenuRecommendation } from '../types/tablemate';

type State = {
  menus: SoloMenuRecommendation[];
  loading: boolean;
};

export function useSoloRecommendations(): State {
  const [state, setState] = useState<State>({ menus: [], loading: true });

  useEffect(() => {
    let active = true;
    // Pass the device's local hour so rankings match the server's time-slot logic.
    fetchSoloRecommendations(new Date().getHours())
      .then(menus => {
        if (active) {
          setState({ menus, loading: false });
        }
      })
      .catch(() => {
        if (active) {
          setState({ menus: [], loading: false });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
