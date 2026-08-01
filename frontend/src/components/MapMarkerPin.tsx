import React from 'react';
import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { MapCoordinate } from '../services/locationService';

type Props = {
  coordinate: MapCoordinate;
  // Required: a custom-View marker (as opposed to an image marker) has no
  // intrinsic size for the native side to measure on its own — without an
  // explicit width/height, NaverMapMarkerOverlay silently fails to render
  // the child at all rather than falling back to some default size.
  width: number;
  height: number;
  children: React.ReactNode;
};

export function MapMarkerPin({ coordinate, width, height, children }: Props) {
  return (
    <NaverMapMarkerOverlay
      latitude={coordinate.latitude}
      longitude={coordinate.longitude}
      width={width}
      height={height}
      // Centered anchor: the marker is a symmetric dot (matching the start
      // dot's own construction), not a tip-down teardrop — so its center,
      // not its bottom edge, should sit on the coordinate.
      anchor={{ x: 0.5, y: 0.5 }}>
      {children}
    </NaverMapMarkerOverlay>
  );
}
