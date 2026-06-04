import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPinAnchor, getMapPinPoint } from './MapPinAnchor';
import { theme } from '../design/theme';

export type PlacePin = {
  id: string;
  name: string;
  meta: string;
  note: string;
  menu: string[];
  top: number;
  left: number;
};

const PLACE_PIN_OFFSET_Y = -12;

export function isTouchNearPlacePin(
  x: number,
  y: number,
  layout: { width: number; height: number },
  placeList: PlacePin[],
  radius = 56,
) {
  if (layout.width === 0 || layout.height === 0) {
    return false;
  }

  return placeList.some(place => {
    const point = getMapPinPoint(place.top, place.left, layout);
    const dx = x - point.x;
    const dy = y - point.y;

    return Math.hypot(dx, dy) < radius;
  });
}

type Props = {
  places: PlacePin[];
  selectedPlaceId?: string;
  onSelectPlace?: (place: PlacePin) => void;
};

export function FloatingPlacePins({
  places,
  selectedPlaceId,
  onSelectPlace,
}: Props) {
  return (
    <View pointerEvents="box-none" style={styles.layer}>
      {places.map((place, index) => (
        <FloatingPin
          key={place.id}
          place={place}
          delay={index * 240}
          selected={place.id === selectedPlaceId}
          onPress={() => onSelectPlace?.(place)}
        />
      ))}
    </View>
  );
}

function FloatingPin({
  place,
  delay,
  selected,
  onPress,
}: {
  place: PlacePin;
  delay: number;
  selected: boolean;
  onPress: () => void;
}) {
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(lift, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(lift, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [delay, lift]);

  return (
    <MapPinAnchor
      top={place.top}
      left={place.left}
      offsetY={PLACE_PIN_OFFSET_Y}
      lift={lift.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -7],
      })}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${place.name} 선택`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pinButton,
          selected && styles.selectedPinButton,
          pressed && styles.pressed,
        ]}>
        <View style={[styles.pinDot, selected && styles.selectedPinDot]} />
        <View style={[styles.pinLabel, selected && styles.selectedPinLabel]}>
          <Text style={styles.pinName}>{place.name}</Text>
          <Text style={styles.pinMeta}>{place.meta}</Text>
        </View>
      </Pressable>
    </MapPinAnchor>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
  },
  pinButton: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    padding: theme.spacing.sm,
  },
  selectedPinButton: {
    backgroundColor: 'rgba(255, 216, 77, 0.24)',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    borderWidth: 4,
    borderColor: theme.colors.surface,
    ...theme.shadow.soft,
  },
  selectedPinDot: {
    width: 24,
    height: 24,
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.primary,
  },
  pinLabel: {
    marginTop: theme.spacing.xs,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    ...theme.shadow.soft,
  },
  selectedPinLabel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.accent,
  },
  pinName: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  pinMeta: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
});
