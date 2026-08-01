import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NaverMapPathOverlay } from '@mj-studio/react-native-naver-map';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { IconButton } from '../components/IconButton';
import { LiveMapView } from '../components/LiveMapView';
import { MapMarkerPin } from '../components/MapMarkerPin';
import { OpenStatusBadge } from '../components/OpenStatusBadge';
import { PlaceMeta } from '../components/PlaceMeta';
import { RatingStars } from '../components/RatingStars';
import { shellStyles } from '../design/shellStyles';
import { theme } from '../design/theme';
import { useUserLocation } from '../hooks/useUserLocation';
import { ApiError, postRoute } from '../api/client';
import { MapCoordinate, regionCovering } from '../services/locationService';
import { Recommendation } from '../types/recommendation';

type Props = {
  place: Recommendation;
  onBack: () => void;
  onGoHome: () => void;
};

const PIN_SIZE = 26; // must match styles.pinHalo's width/height below

export function GuideScreen({ place, onBack, onGoHome }: Props) {
  const insets = useSafeAreaInsets();
  const { center: userCoord, loading: locationLoading } = useUserLocation();

  const placeCoord = useMemo<MapCoordinate>(
    () => ({ latitude: place.lat, longitude: place.lng }),
    [place.lat, place.lng],
  );

  const [routeCoords, setRouteCoords] = useState<MapCoordinate[]>([]);
  const [routeLoading, setRouteLoading] = useState(true);
  const [routeError, setRouteError] = useState<string | null>(null);
  // Camera anchor for `region` below — frozen per destination so watchPosition
  // ticks don't fight the user's pan/zoom (see the memo's comment).
  const [anchorCoord, setAnchorCoord] = useState<MapCoordinate | null>(null);

  useEffect(() => {
    if (locationLoading) {
      return;
    }
    let active = true;
    setRouteLoading(true);
    setRouteError(null);
    // Clear any route drawn for a previous destination — GuideScreen stays
    // mounted across trips (see App.tsx), so without this a failed fetch
    // here would leave the old polyline pointing at the wrong place.
    setRouteCoords([]);
    // Same trigger (destination change / initial fix) also re-anchors the
    // camera — see the `region` memo below for why this can't just read
    // `userCoord` on every render.
    setAnchorCoord(userCoord);

    postRoute(userCoord, placeCoord)
      .then(result => {
        if (active) {
          setRouteCoords(result.coordinates);
        }
      })
      .catch(err => {
        if (active) {
          setRouteError(
            err instanceof ApiError ? err.message : '경로를 불러오지 못했습니다.',
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

  // `region` is NOT derived straight from `userCoord`: watchPosition
  // (distanceFilter: 5) produces a new coordinate object every ~5m of
  // walking, and LiveMapView passes `region` to NaverMapView as a controlled
  // prop — recomputing it on every tick would re-frame the camera and fight
  // the user's own pan/zoom on the one screen they're actively looking at
  // while walking. `anchorCoord` (set above, once per destination) is used
  // instead, and deliberately kept out of this memo's deps for the same
  // reason the effect above omits it. The live dot still tracks via
  // `userCoord` passed to LiveMapView below.
  const region = useMemo(
    () => regionCovering(anchorCoord ?? userCoord, placeCoord),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [anchorCoord, placeCoord],
  );

  const openInNaverMap = async () => {
    // Visit logging happens once, earlier, in App.tsx's openGuide — as soon
    // as the user commits to being guided here, not gated on this external
    // handoff — so a user who never taps this button still shows up in
    // History. Recording it again here would double-count the same visit.

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

    try {
      const canOpenNaverMap = await Linking.canOpenURL('nmap://');

      if (canOpenNaverMap) {
        await Linking.openURL(naverUrl);
        return;
      }

      // Not installed — send to the Play Store listing instead of failing silently.
      await Linking.openURL(
        'https://play.google.com/store/apps/details?id=com.nhn.android.nmap',
      );
    } catch {
      // Linking.openURL rejects when no activity can handle the intent
      // (e.g. emulator with no Play Store and Naver Map not installed) —
      // surface it instead of leaving the button looking like it did nothing.
      setRouteError('네이버 지도를 열지 못했습니다.');
    }
  };

  return (
    <View style={styles.root}>
      {locationLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <LiveMapView region={region} userCoordinate={userCoord}>
          <MapMarkerPin coordinate={placeCoord} width={PIN_SIZE} height={PIN_SIZE}>
            {/* Squared off (vs. the round blue start dot) plus a faint amber
                halo, so "there" reads as clearly distinct from "here" by
                shape, not just color. */}
            <View style={styles.pinHalo} collapsable={false}>
              <View style={styles.pinCore} />
            </View>
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

      <View style={[styles.backTag, { top: insets.top + theme.spacing.md }]}>
        <IconButton label="다시 추천받기" name="back" variant="floating" onPress={onBack} />
      </View>

      <View style={[styles.homeTag, { top: insets.top + theme.spacing.md }]}>
        <IconButton label="처음 화면으로 이동" name="home" variant="floating" onPress={onGoHome} />
      </View>

      <View
        style={[
          shellStyles.bottomPanel,
          { paddingBottom: insets.bottom + theme.spacing.sm },
        ]}>
        <Text style={styles.placeName}>{place.name}</Text>
        <View style={styles.metaRow}>
          <RatingStars rating={place.rating} ratingCount={place.ratingCount} />
          <OpenStatusBadge openNow={place.openNow} />
        </View>
        <PlaceMeta
          distanceMinutes={place.distanceMinutes}
          category={place.category}
          address={place.address}
        />
        {routeLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.action} />
        ) : routeError ? (
          <Text style={styles.errorText}>{routeError}</Text>
        ) : null}
        <AppButton
          label="네이버 지도로 안내"
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
  },
  homeTag: {
    position: 'absolute',
    right: theme.spacing.lg,
  },
  placeName: {
    ...theme.text.title,
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  errorText: {
    ...theme.text.caption,
    color: theme.colors.danger,
  },
  action: {
    marginTop: theme.spacing.md,
  },
  pinHalo: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 165, 36, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCore: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: theme.colors.star,
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
});
