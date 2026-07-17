import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { mapLayoutStyles } from '../design/mapLayout';
import { theme } from '../design/theme';
import { LiveMapView } from './LiveMapView';
import { MapRegion } from '../services/locationService';
import { PlacePin } from '../types/sinchonGuide';

type Props = {
  solo: boolean;
  loading: boolean;
  region: MapRegion;
  recommendedPlace?: PlacePin | null;
  focusRegion?: MapRegion | null;
};

export function MapStage({
  solo,
  loading,
  region,
  recommendedPlace,
  focusRegion,
}: Props) {
  return (
    <View style={mapLayoutStyles.mapStage} collapsable={false}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.loadingText}>현재 위치를 불러오는 중...</Text>
        </View>
      ) : (
        <LiveMapView
          region={region}
          variant={solo ? 'solo' : 'together'}
          mapProps={focusRegion ? { region: focusRegion } : undefined}>
          {recommendedPlace ? (
            <Marker
              coordinate={{
                latitude: recommendedPlace.latitude,
                longitude: recommendedPlace.longitude,
              }}
              title={recommendedPlace.name}
              description={recommendedPlace.meta}
              pinColor={theme.colors.accent}
            />
          ) : null}
        </LiveMapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    backgroundColor: '#C5D8F2',
  },
  loadingText: {
    color: theme.colors.primary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
});
