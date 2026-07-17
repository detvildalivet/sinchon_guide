import React, { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { MapViewProps, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapRegion } from '../services/locationService';

type Props = PropsWithChildren<{
  region: MapRegion;
  variant?: 'together' | 'solo';
  onMapPress?: () => void;
  mapProps?: Partial<MapViewProps>;
}>;

export function LiveMapView({
  region,
  variant = 'together',
  onMapPress,
  mapProps,
  children,
}: Props) {
  const solo = variant === 'solo';

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {/* Expo Go on iOS does not bundle the Google Maps SDK — Apple Maps there. */}
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={region}
        mapType="standard"
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        zoomEnabled
        scrollEnabled
        pitchEnabled={false}
        rotateEnabled={false}
        onPress={
          onMapPress
            ? event => {
                if (event.nativeEvent.action !== 'marker-press') {
                  onMapPress();
                }
              }
            : undefined
        }
        {...mapProps}>
        {children}
      </MapView>
      <View
        pointerEvents="none"
        style={[styles.veil, solo ? styles.veilSolo : styles.veilTogether]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
  },
  veilTogether: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  veilSolo: {
    backgroundColor: 'rgba(8, 23, 65, 0.18)',
  },
});
