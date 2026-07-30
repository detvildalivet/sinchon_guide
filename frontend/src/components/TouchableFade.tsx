import React, { PropsWithChildren, useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

type Props = PressableProps & {
  activeOpacity?: number;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TouchableFade({ children, activeOpacity = 0.7, style, ...rest }: PropsWithChildren<Props>) {
  const anim = useRef(new Animated.Value(1)).current;

  const fadeTo = (toValue: number, duration = 120) => {
    Animated.timing(anim, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        fadeTo(activeOpacity, 100);
        rest.onPressIn && rest.onPressIn(e);
      }}
      onPressOut={(e) => {
        fadeTo(1, 160);
        rest.onPressOut && rest.onPressOut(e);
      }}
      style={[style, { opacity: anim }]}
    >
      {children}
    </AnimatedPressable>
  );
}
