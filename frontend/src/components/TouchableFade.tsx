import React, { PropsWithChildren, useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

type Props = PressableProps & {
  activeOpacity?: number;
  style?: StyleProp<ViewStyle>;
};

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
    <Pressable
      {...rest}
      onPressIn={(e) => {
        fadeTo(activeOpacity, 100);
        rest.onPressIn && rest.onPressIn(e as any);
      }}
      onPressOut={(e) => {
        fadeTo(1, 160);
        rest.onPressOut && rest.onPressOut(e as any);
      }}
      style={typeof style === 'function' ? style as any : style}
    >
      <Animated.View style={{ opacity: anim }}>{children}</Animated.View>
    </Pressable>
  );
}
