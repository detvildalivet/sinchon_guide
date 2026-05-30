import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../design/theme';

type Props = {
  current: number;
  total: number;
  label: string;
};

export function PhaseIndicator({ current, total, label }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index < current && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  label: {
    color: theme.colors.subtle,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  dots: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: '#D7DDEB',
  },
  activeDot: {
    width: 18,
    backgroundColor: theme.colors.primary,
  },
});
