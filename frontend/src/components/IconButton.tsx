import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Icon, IconName } from './Icon';
import { theme } from '../design/theme';

type Variant = 'surface' | 'floating';

// Shared with screens that position content relative to this button (e.g.
// HistoryScreen's scroll padding) so the two never drift out of sync again.
export const ICON_BUTTON_SIZE = 44;

type Props = {
  label: string;
  name: IconName;
  onPress: () => void;
  variant?: Variant;
};

// `surface` sits on a light background (headers, back tags). `floating`
// sits over the map (GuideScreen's back/home buttons) and gets the
// stronger floating shadow to lift off the map tiles.
export function IconButton({ label, name, onPress, variant = 'surface' }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'floating' ? theme.shadow.floating : theme.shadow.soft,
        pressed && styles.pressed,
      ]}>
      <Icon name={name} size={20} color={theme.colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
