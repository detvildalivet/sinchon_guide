import React from 'react';
import { Text } from 'react-native';
import { theme } from '../design/theme';

// ponytail: unicode glyphs standing in for a real icon set — no new
// dependency needed (native rebuild risk, see CLAUDE.md's Android build
// section). Swap for react-native-svg if a custom mark is ever needed.
const GLYPHS = {
  menu: '≡',
  home: '⌂',
  back: '‹',
  forward: '›',
  star: '★',
  starEmpty: '☆',
  pin: '◉',
  search: '⌕',
} as const;

export type IconName = keyof typeof GLYPHS;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 20, color = theme.colors.text }: Props) {
  return (
    <Text
      allowFontScaling={false}
      style={{ fontSize: size, lineHeight: size, color, fontWeight: '400' }}>
      {GLYPHS[name]}
    </Text>
  );
}
