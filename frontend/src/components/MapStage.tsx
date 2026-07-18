import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { homeCategoryPins } from '../design/homeMapPins';
import { mapLayoutStyles } from '../design/mapLayout';
import { theme } from '../design/theme';
import { useUserLocation } from '../hooks/useUserLocation';
import { LiveMapView } from './LiveMapView';
import { VenueCategory } from '../types/domain';

const categoryMeta: Record<
  VenueCategory,
  { label: string; caption: string; symbol: string }
> = {
  restaurant: { label: '음식점', caption: '밥 먹기', symbol: '食' },
  cafe: { label: '카페', caption: '커피 한 잔', symbol: '☕' },
  bar: { label: '술집', caption: '가볍게 한 잔', symbol: '夜' },
};

const categoryColors: Record<VenueCategory, string> = {
  restaurant: theme.colors.primary,
  cafe: theme.colors.accent,
  bar: '#7C3AED',
};

type Props = {
  solo: boolean;
  onSelectCategory: (category: VenueCategory) => void;
};

export function MapStage({
  solo,
  onSelectCategory,
}: Props) {
  const { region, loading } = useUserLocation();

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
        />
      )}

      {!loading && !solo ? (
        <View style={styles.pinOverlay} pointerEvents="box-none">
          {homeCategoryPins.map(pin => (
            <MapActionPin
              key={pin.id}
              top={pin.top}
              left={pin.left}
              accessibilityLabel={`${categoryMeta[pin.id].label} 가게 고르기`}
              onPress={() => onSelectCategory(pin.id)}>
              <CategoryPin category={pin.id} />
            </MapActionPin>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MapActionPin({
  top,
  left,
  accessibilityLabel,
  onPress,
  children,
}: {
  top: number;
  left: number;
  accessibilityLabel: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={14}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionPin,
        {
          top: `${top}%`,
          left: `${left}%`,
          transform: [
            { translateX: -46 },
            { translateY: -104 },
            { scale: pressed ? 0.96 : 1 },
          ],
        },
      ]}>
      {children}
    </Pressable>
  );
}

function CategoryPin({ category }: { category: VenueCategory }) {
  const meta = categoryMeta[category];

  return (
    <View style={styles.pinStack}>
      <View style={styles.pinShadow} />
      <View style={[styles.pin, { backgroundColor: categoryColors[category] }]}>
        <Text
          style={[
            styles.pinSymbol,
            category === 'cafe' && styles.darkPinSymbol,
          ]}>
          {meta.symbol}
        </Text>
      </View>
      <View style={styles.pinPoint} />
      <View style={styles.pinLabel}>
        <Text style={styles.pinTitle}>{meta.label}</Text>
        <Text style={styles.pinCaption}>{meta.caption}</Text>
      </View>
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
  pinOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 6,
    elevation: 2,
    backgroundColor: 'transparent',
  },
  actionPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinStack: {
    alignItems: 'center',
  },
  pinShadow: {
    position: 'absolute',
    bottom: 44,
    width: 38,
    height: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(16, 24, 40, 0.16)',
    transform: [{ scaleX: 1.25 }],
  },
  pin: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.surface,
  },
  pinSymbol: {
    color: theme.colors.textOnPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  darkPinSymbol: {
    color: theme.colors.text,
  },
  pinPoint: {
    width: 18,
    height: 18,
    marginTop: -9,
    borderRadius: 4,
    backgroundColor: theme.colors.surface,
    transform: [{ rotate: '45deg' }],
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
  },
  pinLabel: {
    minWidth: 92,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.96)',
  },
  pinTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  pinCaption: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
});
