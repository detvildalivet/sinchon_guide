import { VenueCategory } from '../types/sinchonGuide';

/** Full-screen map coordinates (% of measured stage). Used by MapBackdrop's
 *  decorative road/block layout — not by real map markers. */
export const homeCategoryPins: Array<{
  id: VenueCategory;
  top: number;
  left: number;
}> = [
  { id: 'restaurant', top: 62, left: 22 },
  { id: 'cafe', top: 49, left: 54 },
  { id: 'bar', top: 70, left: 70 },
];
