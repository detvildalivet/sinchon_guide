import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedHint } from '../components/AnimatedHint';
import { AppButton } from '../components/AppButton';
import { CardTransition } from '../components/CardTransition';
import { CategorySwitcher } from '../components/CategorySwitcher';
import { PlacePin } from '../components/FloatingPlacePins';
import { LiveMapView } from '../components/LiveMapView';
import { QueueStatusCard } from '../components/QueueStatusCard';
import { mapLayoutStyles } from '../design/mapLayout';
import { shellStyles } from '../design/shellStyles';
import { theme } from '../design/theme';
import { useUserLocation } from '../hooks/useUserLocation';
import { usePlaces } from '../hooks/usePlaces';
import { fetchQueueInfo } from '../api/client';
import { ApiQueueInfo } from '../api/types';
import {
  MapCoordinate,
  offsetCoordinate,
  regionAround,
} from '../services/locationService';
import { QueueMode, VenueCategory } from '../types/tablemate';

const categoryLabels: Record<VenueCategory, string> = {
  restaurant: '음식점',
  cafe: '카페',
  bar: '술집',
};

type Props = {
  category: VenueCategory;
  onQueue: (
    place: PlacePin,
    mode: QueueMode,
    queueId: number | null,
    waitingCount: number,
  ) => void;
  onHomePress: () => void;
  onCategoryChange: (category: VenueCategory) => void;
};

export function PreferenceScreen({
  category,
  onQueue,
  onHomePress,
  onCategoryChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const { center, loading } = useUserLocation();
  const { places: placeList, loading: placesLoading } = usePlaces(category);
  const [selectedPlace, setSelectedPlace] = useState<PlacePin | null>(null);
  const [displayPlace, setDisplayPlace] = useState<PlacePin | null>(null);
  const [queueInfo, setQueueInfo] = useState<ApiQueueInfo | null>(null);
  const categoryPanel = useState(() => new Animated.Value(1))[0];
  const placePanel = useState(() => new Animated.Value(0))[0];
  const placeCoordinates = useMemo(
    () => getPlaceCoordinates(center, placeList),
    [placeList, center],
  );
  const mapRegion = useMemo(() => regionAround(center, 0.014, 0.014), [center]);

  useEffect(() => {
    setSelectedPlace(null);
  }, [category]);

  // Fetch live queue status whenever a place is selected.
  useEffect(() => {
    if (!displayPlace) {
      setQueueInfo(null);
      return;
    }
    let active = true;
    setQueueInfo(null);
    fetchQueueInfo(displayPlace.id)
      .then(info => {
        if (active) {
          setQueueInfo(info);
        }
      })
      .catch(() => {
        if (active) {
          setQueueInfo({
            placeId: displayPlace.id,
            exists: false,
            waitingCount: 0,
            queueId: null,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [displayPlace]);

  useEffect(() => {
    if (selectedPlace) {
      setDisplayPlace(selectedPlace);
    }

    Animated.parallel([
      Animated.timing(categoryPanel, {
        toValue: selectedPlace ? 0 : 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(placePanel, {
        toValue: selectedPlace ? 1 : 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && !selectedPlace) {
        setDisplayPlace(null);
      }
    });
  }, [categoryPanel, placePanel, selectedPlace]);

  return (
    <View style={mapLayoutStyles.screenRoot}>
      <View style={mapLayoutStyles.mapViewport}>
        {loading || placesLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={styles.loadingText}>
              {loading ? '현재 위치를 불러오는 중...' : '주변 장소를 불러오는 중...'}
            </Text>
          </View>
        ) : (
          <LiveMapView
            region={mapRegion}
            onMapPress={() => setSelectedPlace(null)}
            mapProps={{
              region: mapRegion,
            }}>
            {placeList.map(place => (
              <Marker
                key={place.id}
                coordinate={placeCoordinates[place.id]}
                title={place.name}
                description={place.meta}
                pinColor={
                  place.id === selectedPlace?.id
                    ? theme.colors.accent
                    : markerColors[category]
                }
                onPress={event => {
                  event.stopPropagation();
                  setSelectedPlace(place);
                }}
              />
            ))}
          </LiveMapView>
        )}
      </View>

      <View style={mapLayoutStyles.overlayLayer} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="장소 선택 취소"
          onPress={() => setSelectedPlace(null)}
          style={[
            shellStyles.promptPanel,
            styles.promptPanel,
            { top: insets.top + theme.spacing.md },
          ]}>
          <View style={styles.promptTopRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="메인으로"
              onPress={onHomePress}
              style={({ pressed }) => [
                styles.backTag,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.backTagText}>{'< 메인으로'}</Text>
            </Pressable>
            <Text style={styles.eyebrow}>{categoryLabels[category]}</Text>
          </View>
          <Text style={styles.question}>함께 갈 장소를 골라보세요</Text>
          <Text style={styles.description}>핀을 눌러 후보를 확인해보세요.</Text>
          <AnimatedHint text="빈 지도를 누르면 선택이 취소돼요" />
        </Pressable>

        <Animated.View
          pointerEvents={selectedPlace ? 'none' : 'auto'}
          style={[
            styles.categoryPanel,
            {
              bottom: insets.bottom + theme.spacing.lg,
              opacity: categoryPanel,
              transform: [
                {
                  translateY: categoryPanel.interpolate({
                    inputRange: [0, 1],
                    outputRange: [38, 0],
                  }),
                },
              ],
            },
          ]}>
          <CategorySwitcher
            category={category}
            onCategoryChange={onCategoryChange}
            style={styles.categorySwitcher}
          />
        </Animated.View>

        <Animated.View
          pointerEvents={selectedPlace ? 'auto' : 'none'}
          style={[
            shellStyles.bottomPanel,
            styles.placePanel,
            {
              paddingBottom: insets.bottom + theme.spacing.sm,
              opacity: placePanel,
              transform: [
                {
                  translateY: placePanel.interpolate({
                    inputRange: [0, 1],
                    outputRange: [46, 0],
                  }),
                },
              ],
            },
          ]}>
          {displayPlace ? (
            <CardTransition transitionKey={displayPlace.id}>
              <>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewKicker}>선택한 후보</Text>
                  <Text style={styles.previewMeta}>{displayPlace.meta}</Text>
                </View>
                <Text style={styles.previewName}>{displayPlace.name}</Text>
                <Text style={styles.previewNote}>{displayPlace.note}</Text>
                <View style={styles.menuRow}>
                  {displayPlace.menu.map(menu => (
                    <View key={menu} style={styles.menuChip}>
                      <Text style={styles.menuText}>{menu}</Text>
                    </View>
                  ))}
                </View>
                {queueInfo === null ? (
                  <ActivityIndicator
                    color={theme.colors.primary}
                    style={styles.queueAction}
                  />
                ) : (
                  <>
                    <QueueStatusCard
                      mode={queueInfo.exists ? 'join' : 'create'}
                      waitingCount={queueInfo.waitingCount}
                      compact
                    />
                    <AppButton
                      label={queueInfo.exists ? '큐 조인' : '큐 생성하기'}
                      onPress={() =>
                        onQueue(
                          displayPlace,
                          queueInfo.exists ? 'join' : 'create',
                          queueInfo.queueId,
                          queueInfo.waitingCount,
                        )
                      }
                      variant="accent"
                      style={styles.queueAction}
                    />
                  </>
                )}
              </>
            </CardTransition>
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
}

const markerColors: Record<VenueCategory, string> = {
  restaurant: theme.colors.primary,
  cafe: theme.colors.accent,
  bar: '#7C3AED',
};

function getPlaceCoordinates(
  center: MapCoordinate,
  placeList: PlacePin[],
): Record<string, MapCoordinate> {
  return placeList.reduce((acc, place) => {
    const metersNorth = (50 - place.top) * 14;
    const metersEast = (place.left - 50) * 14;
    acc[place.id] = offsetCoordinate(center, metersNorth, metersEast);
    return acc;
  }, {} as Record<string, MapCoordinate>);
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
  promptPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.96)',
  },
  promptTopRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  backTag: {
    minHeight: 30,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(15, 76, 207, 0.08)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  backTagText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  categorySwitcher: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    ...theme.shadow.floating,
  },
  categoryPanel: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 3,
  },
  placePanel: {
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.98)',
  },
  queueAction: {
    marginTop: theme.spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  previewKicker: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  previewMeta: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  previewName: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: '900',
  },
  previewNote: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    lineHeight: 18,
    fontWeight: '700',
  },
  menuRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  menuChip: {
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(15, 76, 207, 0.08)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  menuText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  eyebrow: {
    color: theme.colors.text,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  question: {
    color: theme.colors.text,
    fontSize: theme.typography.title,
    lineHeight: 36,
    fontWeight: '900',
  },
  description: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
});
