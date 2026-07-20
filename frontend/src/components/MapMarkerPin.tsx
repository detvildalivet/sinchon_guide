import React from 'react';
import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { MapCoordinate } from '../services/locationService';

type Props = {
  coordinate: MapCoordinate;
  onPress?: () => void;
  // Required: a custom-View marker (as opposed to an image marker) has no
  // intrinsic size for the native side to measure on its own — without an
  // explicit width/height, NaverMapMarkerOverlay silently fails to render
  // the child at all rather than falling back to some default size.
  width: number;
  height: number;
  children: React.ReactNode;
};

export function MapMarkerPin({ coordinate, onPress, width, height, children }: Props) {
  return (
    <NaverMapMarkerOverlay
      latitude={coordinate.latitude}
      longitude={coordinate.longitude}
      width={width}
      height={height}
      anchor={{ x: 0.5, y: 1 }}
      onTap={onPress}>
      {children}
    </NaverMapMarkerOverlay>
  );
}
