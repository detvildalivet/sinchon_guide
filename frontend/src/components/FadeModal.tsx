import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../design/theme';

type Props = {
  visible: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  onDismiss?: () => void;
  animationDuration?: number;
};

export function FadeModal({
  visible,
  children,
  style,
  onDismiss,
  animationDuration = 220,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: animationDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: animationDuration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
          onDismiss && onDismiss();
        }
      });
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.overlay, { opacity }, style]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.sheet}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 61, 145, 0.48)',
    justifyContent: 'flex-end',
    zIndex: 2000,
    elevation: 30,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '85%',
    overflow: 'hidden',
    ...theme.shadow.floating,
  },
});
