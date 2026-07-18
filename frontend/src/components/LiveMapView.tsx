import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
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
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
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
  veilSolo: {
    backgroundColor: 'rgba(8, 23, 65, 0.18)',
  },
});
