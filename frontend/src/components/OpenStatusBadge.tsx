import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { shellStyles } from '../design/shellStyles';
import { theme } from '../design/theme';

type Props = {
  openNow: boolean | null;
};

// openNow is only populated for the nearest few candidates that got a
// plausible Google match (see backend/services/enrichment.py) — null is a
// normal "we don't know" case, not an error, so it gets its own honest label
// rather than being hidden (which is how a user could end up guided to a
// closed place with no warning at all).
export function OpenStatusBadge({ openNow }: Props) {
  const label =
    openNow === true ? '영업 중' : openNow === false ? '영업 종료' : '영업정보 없음';
  const style =
    openNow === true ? styles.open : openNow === false ? styles.closed : styles.unknown;
  const textStyle =
    openNow === true
      ? styles.openText
      : openNow === false
      ? styles.closedText
      : styles.unknownText;

  return (
    <View style={[shellStyles.chip, style]}>
      <Text style={[shellStyles.chipText, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  open: {
    backgroundColor: theme.colors.successSoft,
  },
  openText: {
    color: theme.colors.success,
  },
  closed: {
    backgroundColor: theme.colors.dangerSoft,
  },
  closedText: {
    color: theme.colors.danger,
  },
  unknown: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  unknownText: {
    color: theme.colors.muted,
  },
});
