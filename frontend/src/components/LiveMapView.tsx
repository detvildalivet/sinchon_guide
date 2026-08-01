import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { NaverMapView } from '@mj-studio/react-native-naver-map';
import { MapCoordinate, MapRegion } from '../services/locationService';

type Props = PropsWithChildren<{
  region: MapRegion;
  userCoordinate?: MapCoordinate;
}>;

export function LiveMapView({ region, userCoordinate, children }: Props) {
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
        }>
        {children}
      </NaverMapView>
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
});
