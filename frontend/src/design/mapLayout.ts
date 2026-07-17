import { StyleSheet } from 'react-native';
import { theme } from './theme';

/** Bottom tab bar overlay height — pins only, not the map background. */
export const TAB_BAR_CLEARANCE = 112;

/** Map base tint — used as screen fallback behind the illustrated map. */
export const MAP_BASE_COLOR = '#D8E4F8';

/**
 * Layer order for home map screens.
 * Never put elevation on full-screen wrappers — Android paints them white.
 */
export const MAP_LAYER = {
  map: { zIndex: 0, elevation: 0 },
  pins: { zIndex: 5, elevation: 0 },
  prompt: { zIndex: 11, elevation: 8 },
  sheet: { zIndex: 12, elevation: 10 },
} as const;

export const mapLayoutStyles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: MAP_BASE_COLOR,
  },
  mapStage: {
    ...StyleSheet.absoluteFillObject,
    ...MAP_LAYER.map,
  },
  pinOverlay: {
    ...StyleSheet.absoluteFillObject,
    ...MAP_LAYER.pins,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    ...MAP_LAYER.map,
  },
  mapViewport: {
    ...StyleSheet.absoluteFillObject,
    ...MAP_LAYER.map,
    overflow: 'hidden',
  },
  mapCanvas: {
    ...StyleSheet.absoluteFillObject,
  },
  mapContent: {
    ...StyleSheet.absoluteFillObject,
    ...MAP_LAYER.pins,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  pinLayer: {
    ...StyleSheet.absoluteFillObject,
    ...MAP_LAYER.pins,
    backgroundColor: 'transparent',
  },
  uiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 0,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  promptSlot: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    ...MAP_LAYER.prompt,
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 0,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
});
