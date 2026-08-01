import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

type Props = PropsWithChildren<{
  visible: boolean;
}>;

export function CrossfadeSwitch({ visible, children }: Props) {
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
      style={[styles.layer, { opacity }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
});
