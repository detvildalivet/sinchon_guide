import { VenueCategory } from '../types/domain';

// Solo-menu scoring now lives on the backend (`GET /recommendations/solo`).
// This module retains only the shared category-label helper used by the UI.

export function getCategoryLabel(category: VenueCategory) {
  const labels: Record<VenueCategory, string> = {
    restaurant: '음식점',
    cafe: '카페',
    bar: '술집',
  };

  return labels[category];
}
