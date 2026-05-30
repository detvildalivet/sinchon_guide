import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

type Props = PropsWithChildren<{
  transitionKey: string;
}>;

export function CardTransition({ children, transitionKey }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateX.setValue(16);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        damping: 18,
        stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateX, transitionKey]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
}

