import { VenueCategory } from '../types/domain';

/** Mock venue offsets from the user's current location (meters). */
export const venueOffsets: Record<
  VenueCategory,
  { metersNorth: number; metersEast: number }
> = {
  restaurant: { metersNorth: -280, metersEast: -160 },
  cafe: { metersNorth: -60, metersEast: 210 },
  bar: { metersNorth: 320, metersEast: 280 },
};

export const homeVenueOrder: VenueCategory[] = ['restaurant', 'cafe', 'bar'];
