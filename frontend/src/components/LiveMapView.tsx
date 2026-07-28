import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { NaverMapView, NaverMapViewProps } from '@mj-studio/react-native-naver-map';
import { MapCoordinate, MapRegion } from '../services/locationService';

type Props = PropsWithChildren<{
  region: MapRegion;
  userCoordinate?: MapCoordinate;
  variant?: 'together' | 'solo';
  onMapPress?: () => void;
  mapProps?: Partial<NaverMapViewProps>;
}>;

export function LiveMapView({
  region,
  userCoordinate,
  variant = 'together',
  onMapPress,
  mapProps,
  children,
}: Props) {
  const solo = variant === 'solo';

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <NaverMapView
        style={styles.map}
        region={region}
        isShowCompass={false}
        isShowLocationButton={false}
        isScrollGesturesEnabled
        isZoomGesturesEnabled
        isTiltGesturesEnabled={false}
        isRotateGesturesEnabled={false}
        locationOverlay={
          userCoordinate
            ? { isVisible: true, position: userCoordinate }
            : undefined
        }
        onTapMap={onMapPress}
        {...mapProps}>
        {children}
      </NaverMapView>
      {!solo && (
        <View pointerEvents="none" style={[styles.veil, styles.veilTogether]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  veil: {
    ...StyleSheet.absoluteFill,
  },
  veilTogether: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
