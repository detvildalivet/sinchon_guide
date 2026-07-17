import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../design/theme';
import { HomeTab } from '../types/sinchonGuide';

type Props = {
  active: HomeTab;
  onChange: (tab: HomeTab) => void;
};

const tabs: Array<{ id: HomeTab; label: string; caption: string }> = [
  { id: 'together', label: '같이 먹기', caption: '지도에서 골라요' },
  { id: 'solo', label: '혼밥 추천', caption: '메뉴 추천' },
];

export function MainTabBar({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();
  const modeAnim = useRef(new Animated.Value(active === 'solo' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(modeAnim, {
      toValue: active === 'solo' ? 1 : 0,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [active, modeAnim]);

  const wrapBackground = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.glass, 'rgba(15, 61, 145, 0.9)'],
  });
  const wrapBorder = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.92)', 'rgba(255, 216, 77, 0.24)'],
  });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          paddingBottom: insets.bottom + theme.spacing.sm,
          backgroundColor: wrapBackground,
          borderColor: wrapBorder,
        },
      ]}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        const soloActive = isActive && tab.id === 'solo';
        const togetherActive = isActive && tab.id === 'together';

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.id)}
            style={({ pressed }) => [
              styles.tab,
              togetherActive && styles.activeTogetherTab,
              soloActive && styles.activeSoloTab,
              pressed && styles.pressed,
            ]}>
            <Text
              style={[
                styles.label,
                isActive && styles.activeLabel,
              ]}>
              {tab.label}
            </Text>
            <Text
              style={[
                styles.caption,
                isActive && styles.activeCaption,
              ]}>
              {tab.caption}
            </Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: 0,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    ...theme.shadow.floating,
  },
  tab: {
    flex: 1,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  activeTogetherTab: {
    backgroundColor: theme.colors.primary,
  },
  activeSoloTab: {
    backgroundColor: theme.colors.accent,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  activeLabel: {
    color: theme.colors.text,
  },
  caption: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  activeCaption: {
    color: theme.colors.text,
  },
});
