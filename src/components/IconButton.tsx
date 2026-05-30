import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../design/theme';

type Props = {
  label: string;
  icon: string;
  onPress: () => void;
};

export function IconButton({ label, icon, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
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
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: '800',
  },
});
