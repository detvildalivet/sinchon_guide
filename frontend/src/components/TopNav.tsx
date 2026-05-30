import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../design/theme';

type Props = {
  onHomePress: () => void;
  onProfilePress: () => void;
  onMapPress: () => void;
};

export function TopNav({
  onHomePress,
  onProfilePress,
  onMapPress,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + theme.spacing.sm }]}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="홈"
          onPress={onHomePress}
          style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}>
          <Text style={styles.homeIcon}>‹</Text>
          <Text style={styles.homeText}>홈</Text>
        </Pressable>

        <View style={styles.quickActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="프로필"
            onPress={onProfilePress}
            style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}>
            <Text style={styles.quickIcon}>◎</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="지도"
            onPress={onMapPress}
            style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}>
            <Text style={styles.mapIcon}>⌖</Text>
            <Text style={styles.mapText}>지도</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  homeButton: {
    minHeight: 44,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft,
  },
  homeIcon: {
    color: theme.colors.primary,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '500',
  },
  homeText: {
    color: theme.colors.primary,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.soft,
  },
  quickIcon: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  mapButton: {
    minHeight: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadow.soft,
  },
  mapIcon: {
    color: theme.colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  mapText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
