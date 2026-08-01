import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
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
  const value = ratingCount ? `${rating.toFixed(1)} (${ratingCount})` : rating.toFixed(1);

  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {Array.from({ length: STAR_COUNT }, (_, i) => (
          <Icon key={i} name={i < filled ? 'star' : 'starEmpty'} size={14} color={theme.colors.star} />
        ))}
      </View>
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
    flexDirection: 'row',
    gap: 1,
  },
  value: {
    ...theme.text.caption,
    color: theme.colors.muted,
  },
  empty: {
    ...theme.text.caption,
    color: theme.colors.subtle,
  },
});
