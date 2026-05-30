import React, { PropsWithChildren } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { getMapPoint, MapLayoutSize } from '../design/homeMapPins';

type Props = PropsWithChildren<{
  top: number;
  left: number;
  mapSize?: MapLayoutSize;
  offsetY?: number;
  lift?: Animated.AnimatedInterpolation<number>;
  style?: ViewStyle;
}>;

export function MapPinAnchor({
  top,
  left,
  mapSize,
  offsetY = 0,
  lift,
  style,
  children,
}: Props) {
  const point = mapSize ? getMapPoint(top, left, mapSize) : null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.anchor,
        point
          ? { top: point.y, left: point.x }
          : { top: `${top}%`, left: `${left}%` },
        lift ? { transform: [{ translateY: lift }] } : null,
        style,
      ]}>
      <View
        pointerEvents="box-none"
        style={[styles.content, offsetY !== 0 ? { marginTop: offsetY } : null]}>
        {children}
      </View>
    </Animated.View>
  );
}

export { getMapPoint as getMapPinPoint } from '../design/homeMapPins';

export const mapPinStyles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
});

const styles = mapPinStyles;
