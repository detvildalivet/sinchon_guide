import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { LiveMapView } from '../components/LiveMapView';
import { MapMarkerPin } from '../components/MapMarkerPin';
import { shellStyles } from '../design/shellStyles';
import { theme } from '../design/theme';
import { useUserLocation } from '../hooks/useUserLocation';
import { postRoute, postVisit } from '../api/client';
import { decodePolyline } from '../utils/decodePolyline';
import { MapCoordinate, regionCovering } from '../services/locationService';
import { Need, Recommendation } from '../types/recommendation';

type Props = {
  place: Recommendation;
  need: Need;
  onBack: () => void;
};

export function GuideScreen({ place, need, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { center: userCoord, loading: locationLoading } = useUserLocation();

  const placeCoord = useMemo<MapCoordinate>(
    () => ({ latitude: place.lat, longitude: place.lng }),
    [place.lat, place.lng],
  );

  const [routeCoords, setRouteCoords] = useState<MapCoordinate[]>([]);
  const [routeLoading, setRouteLoading] = useState(true);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    if (locationLoading) {
      return;
    }
    let active = true;
    setRouteLoading(true);
    setRouteError(null);

    postRoute(userCoord, placeCoord)
      .then(result => {
        if (active) {
          setRouteCoords(decodePolyline(result.polyline));
        }
      })
      .catch(() => {
        if (active) {
          setRouteError('경로를 불러오지 못했어요.');
        }
      })
      .finally(() => {
        if (active) {
          setRouteLoading(false);
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationLoading, placeCoord.latitude, placeCoord.longitude]);

  const region = useMemo(
    () => regionCovering(userCoord, placeCoord),
    [userCoord, placeCoord],
  );

  const openInGoogleMaps = async () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${placeCoord.latitude},${placeCoord.longitude}&travelmode=walking`;
    postVisit({
      googlePlaceId: place.placeId,
      placeName: place.name,
      type: need.type,
      budget: need.budget,
    }).catch(() => {
      // Visit logging is best-effort personalization data; never block navigation on it.
    });
    await Linking.openURL(url);
  };

  return (
    <View style={styles.root}>
      {locationLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <LiveMapView region={region} variant="solo" mapProps={{ region }}>
          <MapMarkerPin coordinate={placeCoord}>
            <View style={styles.pin} />
          </MapMarkerPin>
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={theme.colors.primary}
              strokeWidth={4}
            />
          )}
        </LiveMapView>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="다시 추천받기"
        onPress={onBack}
        style={[shellStyles.promptPanel, styles.backTag, { top: insets.top + theme.spacing.md }]}>
        <Text style={styles.backTagText}>{'< 다시 추천받기'}</Text>
      </Pressable>

      <View
        style={[
          shellStyles.bottomPanel,
          styles.card,
          { paddingBottom: insets.bottom + theme.spacing.sm },
        ]}>
        <Text style={styles.placeName}>{place.name}</Text>
        <Text style={styles.reason}>{place.reason}</Text>
        {routeLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.action} />
        ) : routeError ? (
          <Text style={styles.errorText}>{routeError}</Text>
        ) : null}
        <AppButton
          label="구글 지도에서 열기"
          variant="accent"
          onPress={openInGoogleMaps}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  backTag: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: undefined,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  backTagText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  card: {
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(255, 255, 255, 0.98)',
    gap: theme.spacing.xs,
  },
  placeName: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: '900',
  },
  reason: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  action: {
    marginTop: theme.spacing.md,
  },
  pin: {
    width: 20,
    height: 20,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
});
