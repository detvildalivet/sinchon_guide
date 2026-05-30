import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

type Props = PropsWithChildren<{
  visible: boolean;
  style?: ViewStyle;
  absolute?: boolean;
}>;

export function CrossfadeSwitch({
  visible,
  style,
  absolute = true,
  children,
}: Props) {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [opacity, visible]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        absolute && styles.layer,
        absolute && styles.fill,
        style,
        { opacity },
      ]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
