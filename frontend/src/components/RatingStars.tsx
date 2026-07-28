import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../design/theme';

const STAR_COUNT = 5;

type Props = {
  rating: number | null;
  ratingCount?: number | null;
};

// Google's Places rating is only available for the nearest few candidates
// that got enriched (see backend/services/enrichment.py) and even then only
// when Google has rating data for that place at all — `rating: null` is a
// normal, common case, not an error, so it must say so explicitly rather
// than silently showing nothing.
export function RatingStars({ rating, ratingCount }: Props) {
  if (rating === null) {
    return <Text style={styles.empty}>평점 없음</Text>;
  }

  const filled = Math.min(STAR_COUNT, Math.max(0, Math.round(rating)));
  const stars = '★'.repeat(filled) + '☆'.repeat(STAR_COUNT - filled);
  const value = ratingCount ? `${rating.toFixed(1)} (${ratingCount})` : rating.toFixed(1);

  return (
    <View style={styles.row}>
      <Text style={styles.stars}>{stars}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  stars: {
    color: theme.colors.accent,
    fontSize: theme.typography.body,
    letterSpacing: 1,
  },
  value: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  empty: {
    color: theme.colors.subtle,
    fontSize: theme.typography.caption,
    fontWeight: '600',
  },
});
