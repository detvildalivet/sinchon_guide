import { MapCoordinate } from '../services/locationService';

/**
 * Decodes a Google encoded polyline (e.g. RouteResult.polyline from
 * POST /routes) into a list of coordinates react-native-maps can render
 * via <Polyline coordinates={...}/>.
 *
 * Standard algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): MapCoordinate[] {
  const coordinates: MapCoordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    lat += decodeSignedValue();
    lng += decodeSignedValue();
    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  // Bitwise ops are inherent to Google's polyline varint encoding.
  /* eslint-disable no-bitwise */
  function decodeSignedValue(): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  }
  /* eslint-enable no-bitwise */

  return coordinates;
}
