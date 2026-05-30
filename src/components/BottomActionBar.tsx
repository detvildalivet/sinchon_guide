import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../design/theme';
import { AppButton } from './AppButton';

type Action = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
};

type Props = {
  primary: Action;
  secondary?: Action;
};

export function BottomActionBar({ primary, secondary }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + theme.spacing.sm }]}>
      {secondary ? (
        <AppButton
          label={secondary.label}
          onPress={secondary.onPress}
          variant={secondary.variant ?? 'secondary'}
          style={styles.secondary}
        />
      ) : null}
      <AppButton
        label={primary.label}
        onPress={primary.onPress}
        variant={primary.variant ?? 'primary'}
        style={styles.primary}
      />
    </View>
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
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    ...theme.shadow.floating,
  },
  primary: {
    flex: 1.25,
  },
  secondary: {
    flex: 1,
  },
});

