import { useCallback, useRef, useState } from 'react';
import { fetchNearbyPlaces } from '../api/client';
import { toPin } from './usePlaces';
import { MapCoordinate } from '../services/locationService';
import { PlacePin, VenueCategory } from '../types/sinchonGuide';

// A single "you may like this" pick, ranked from live Google Places results.
// True personalization (using visit/mood history) is separate, larger work —
// this is a rating-first heuristic: highest rating wins, distance (the order
// each category's nearby-search already returns) breaks ties.
export type RecommendedPlace = PlacePin & { category: VenueCategory };

type State = {
  place: RecommendedPlace | null;
  loading: boolean;
  error: string | null;
};

const CATEGORIES: VenueCategory[] = ['restaurant', 'cafe', 'bar'];

function byRatingDesc(a: RecommendedPlace, b: RecommendedPlace, ratings: Map<string, number | null>) {
  const ra = ratings.get(a.id) ?? null;
  const rb = ratings.get(b.id) ?? null;
  if (ra == null && rb == null) return 0;
  if (ra == null) return 1;
  if (rb == null) return -1;
  return rb - ra;
}

export function usePlaceRecommendation() {
  const [state, setState] = useState<State>({
    place: null,
    loading: false,
    error: null,
  });
  const rankedRef = useRef<RecommendedPlace[]>([]);
  const indexRef = useRef(0);

  const recommend = useCallback(async (center: MapCoordinate) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const results = await Promise.all(
        CATEGORIES.map(category =>
          fetchNearbyPlaces(category, center.latitude, center.longitude),
        ),
      );
      const flat = results.flat();
      const ratings = new Map(flat.map(p => [p.googlePlaceId, p.rating]));
      const merged: RecommendedPlace[] = flat.map(p => ({
        ...toPin(p),
        category: p.placeType,
      }));
      merged.sort((a, b) => byRatingDesc(a, b, ratings));

      rankedRef.current = merged;
      indexRef.current = 0;
      setState({
        place: merged[0] ?? null,
        loading: false,
        error: merged.length === 0 ? '주변에 추천할 장소가 없어요.' : null,
      });
    } catch (e) {
      rankedRef.current = [];
      indexRef.current = 0;
      setState({
        place: null,
        loading: false,
        error: e instanceof Error ? e.message : '추천을 불러오지 못했어요.',
      });
    }
  }, []);

  const reroll = useCallback(() => {
    const ranked = rankedRef.current;
    if (ranked.length === 0) {
      return;
    }
    indexRef.current = (indexRef.current + 1) % ranked.length;
    setState(s => ({ ...s, place: ranked[indexRef.current] }));
  }, []);

  return { ...state, recommend, reroll };
}
