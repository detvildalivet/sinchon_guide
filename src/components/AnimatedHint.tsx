import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { theme } from '../design/theme';

type Props = {
  text: string;
};

export function AnimatedHint({ text }: Props) {
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
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
  }, [lift]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          transform: [
            {
              translateY: lift.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -4],
              }),
            },
          ],
          opacity: lift.interpolate({
            inputRange: [0, 1],
            outputRange: [0.78, 1],
          }),
        },
      ]}>
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255, 216, 77, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 216, 77, 0.42)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  text: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
});
