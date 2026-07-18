import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPinAnchor } from './MapPinAnchor';
import { theme } from '../design/theme';
import { SoloMenuRecommendation } from '../types/domain';

import {
  HOME_PIN_TIP_OFFSET,
  homeCategoryPins,
  MapLayoutSize,
} from '../design/homeMapPins';

const categoryColors: Record<SoloMenuRecommendation['category'], string> = {
  restaurant: theme.colors.primary,
  cafe: theme.colors.accent,
  bar: '#C4B5FD',
};

type Props = {
  menus: SoloMenuRecommendation[];
  mapSize: MapLayoutSize;
  selectedMenuId?: string;
  inverted?: boolean;
  onSelectMenu: (menu: SoloMenuRecommendation) => void;
};

export function FloatingSoloMenuPins({
  menus,
  mapSize,
  selectedMenuId,
  inverted = false,
  onSelectMenu,
}: Props) {
  return (
    <View pointerEvents="box-none" style={styles.layer}>
      {menus.slice(0, 3).map((menu, index) => (
        <MenuPin
          key={menu.id}
          menu={menu}
          mapSize={mapSize}
          delay={index * 240}
          position={{
            top: homeCategoryPins[index].top,
            left: homeCategoryPins[index].left,
          }}
          selected={menu.id === selectedMenuId}
          inverted={inverted}
          onPress={() => onSelectMenu(menu)}
        />
      ))}
    </View>
  );
}

function MenuPin({
  menu,
  mapSize,
  delay,
  position,
  selected,
  inverted,
  onPress,
}: {
  menu: SoloMenuRecommendation;
  mapSize: MapLayoutSize;
  delay: number;
  position: { top: number; left: number };
  selected: boolean;
  inverted: boolean;
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
      top={position.top}
      left={position.left}
      mapSize={mapSize}
      offsetY={HOME_PIN_TIP_OFFSET}
      lift={lift.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -7],
      })}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${menu.menuName} 선택`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pinButton,
          selected && styles.selectedPinButton,
          pressed && styles.pressed,
        ]}>
        <View style={styles.pinShadow} />
        <View
          style={[
            styles.pin,
            {
              backgroundColor: categoryColors[menu.category],
            },
            inverted && styles.pinInverted,
            selected && styles.selectedPin,
          ]}>
          <Text style={[styles.pinSymbol, inverted && styles.pinSymbolInverted]}>
            {menu.score}
          </Text>
        </View>
        <View style={styles.pinPoint} />
        <View
          style={[
            styles.pinLabel,
            inverted && styles.pinLabelInverted,
            selected && styles.selectedPinLabel,
          ]}>
          <Text style={[styles.pinTitle, inverted && styles.pinTitleInverted]}>
            {menu.menuName}
          </Text>
          <Text style={[styles.pinCaption, inverted && styles.pinCaptionInverted]}>
            {menu.venueName}
          </Text>
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
    backgroundColor: 'rgba(255, 216, 77, 0.18)',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
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
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  pinInverted: {
    borderColor: 'rgba(255, 255, 255, 0.92)',
  },
  selectedPin: {
    borderColor: theme.colors.accent,
  },
  pinSymbol: {
    color: theme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  pinSymbolInverted: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.96)',
  },
  pinLabelInverted: {
    backgroundColor: 'rgba(15, 61, 145, 0.82)',
    borderColor: 'rgba(255, 216, 77, 0.24)',
  },
  selectedPinLabel: {
    borderColor: theme.colors.accent,
  },
  pinTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  pinTitleInverted: {
    color: theme.colors.textOnPrimary,
  },
  pinCaption: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  pinCaptionInverted: {
    color: '#DCE6FF',
  },
});
