import { VenueCategory } from '../types/domain';

export type MapLayoutSize = {
  width: number;
  height: number;
};

export const HOME_PIN_TIP_OFFSET = -71;

/** Full-screen map coordinates (% of measured stage). */
export const homeCategoryPins: Array<{
  id: VenueCategory;
  top: number;
  left: number;
}> = [
  { id: 'restaurant', top: 62, left: 22 },
  { id: 'cafe', top: 49, left: 54 },
  { id: 'bar', top: 70, left: 70 },
];

export function getMapPoint(
  top: number,
  left: number,
  size: MapLayoutSize,
) {
  return {
    x: (left / 100) * size.width,
    y: (top / 100) * size.height,
  };
}
