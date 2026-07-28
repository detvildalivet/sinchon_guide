import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NaverMapPathOverlay } from '@mj-studio/react-native-naver-map';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { LiveMapView } from '../components/LiveMapView';
import { MapMarkerPin } from '../components/MapMarkerPin';
import { RatingStars } from '../components/RatingStars';
import { shellStyles } from '../design/shellStyles';
import { theme } from '../design/theme';
import { useUserLocation } from '../hooks/useUserLocation';
import { ApiError, postRoute, postVisit } from '../api/client';
import { MapCoordinate, regionCovering } from '../services/locationService';
import { Need, Recommendation } from '../types/recommendation';

type Props = {
  place: Recommendation;
  need: Need;
  onBack: () => void;
};

const PIN_SIZE = 20; // must match styles.pin's width/height below

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
          setRouteCoords(result.coordinates);
        }
      })
      .catch(err => {
        if (active) {
          setRouteError(
            err instanceof ApiError ? err.message : '경로를 불러오지 못했어요.',
          );
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

  const openInNaverMap = async () => {
    postVisit({
      placeId: place.placeId,
      placeName: place.name,
      type: need.type,
      budget: need.budget,
    }).catch(() => {
      // Visit logging is best-effort personalization data; never block navigation on it.
    });

    // nmap://route/walk — Naver Map's own walking-directions deep link
    // (https://guide.ncloud-docs.com/docs/maps-url-scheme). Note: this opens
    // Naver's turn-by-turn pedestrian nav, distinct from the in-app polyline
    // above which comes from TMAP's Pedestrian Route API.
    const params = new URLSearchParams({
      slat: String(userCoord.latitude),
      slng: String(userCoord.longitude),
      sname: '출발',
      dlat: String(placeCoord.latitude),
      dlng: String(placeCoord.longitude),
      dname: place.name,
      appname: 'com.sinchonguide',
    });
    const naverUrl = `nmap://route/walk?${params.toString()}`;
    const canOpenNaverMap = await Linking.canOpenURL('nmap://');

    if (canOpenNaverMap) {
      await Linking.openURL(naverUrl);
      return;
    }

    // Not installed — send to the Play Store listing instead of failing silently.
    await Linking.openURL(
      'https://play.google.com/store/apps/details?id=com.nhn.android.nmap',
    );
  };

  return (
    <View style={styles.root}>
      {locationLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <LiveMapView region={region} userCoordinate={userCoord} variant="solo">
          <MapMarkerPin coordinate={placeCoord} width={PIN_SIZE} height={PIN_SIZE}>
            <View style={styles.pin} collapsable={false} />
          </MapMarkerPin>
          {routeCoords.length > 1 && (
            <NaverMapPathOverlay
              coords={routeCoords}
              color={theme.colors.primary}
              width={4}
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
        <RatingStars rating={place.rating} />
        <Text style={styles.reason}>{place.reason}</Text>
        {routeLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.action} />
        ) : routeError ? (
          <Text style={styles.errorText}>{routeError}</Text>
        ) : null}
        <AppButton
          label="네이버 지도로 안내"
          variant="accent"
          onPress={openInNaverMap}
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
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
});
