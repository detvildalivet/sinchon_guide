import React from 'react';
import { Marker } from 'react-native-maps';
import { MapCoordinate } from '../services/locationService';

type Props = {
  coordinate: MapCoordinate;
  onPress?: () => void;
  children: React.ReactNode;
};

export function MapMarkerPin({ coordinate, onPress, children }: Props) {
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 1 }}
      centerOffset={{ x: 0, y: -18 }}
      onPress={onPress}
      tracksViewChanges={false}>
      {children}
    </Marker>
  );
}
