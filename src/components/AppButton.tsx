import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { theme } from '../design/theme';

type AppButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles[`${variant}Pressed`],
        style,
      ]}>
      <Text
        style={[
          styles.label,
          variant === 'ghost' && styles.ghostLabel,
          variant === 'accent' && styles.accentLabel,
          variant === 'secondary' && styles.secondaryLabel,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.soft,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  primaryPressed: {
    backgroundColor: theme.colors.primaryPressed,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryPressed: {
    backgroundColor: theme.colors.secondaryPressed,
  },
  accent: {
    backgroundColor: theme.colors.accent,
  },
  accentPressed: {
    backgroundColor: theme.colors.accentPressed,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghostPressed: {
    opacity: 0.76,
  },
  label: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.body,
    fontWeight: '800',
  },
  ghostLabel: {
    color: theme.colors.primary,
  },
  accentLabel: {
    color: theme.colors.text,
  },
  secondaryLabel: {
    color: theme.colors.primary,
  },
});
