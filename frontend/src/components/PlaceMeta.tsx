import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../design/theme';

type Props = {
  distanceMinutes: number;
  category?: string | null;
  address?: string | null;
};

// A compact "도보 N분 · 카페" line, with an optional address line below it.
// Surfaces distance/category — both already fetched (RecommendationOut) but
// previously never displayed anywhere in the app.
export function PlaceMeta({ distanceMinutes, category, address }: Props) {
  const parts = [`도보 ${distanceMinutes}분`];
  if (category) {
    parts.push(category);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.line}>{parts.join(' · ')}</Text>
      {address ? <Text style={styles.address}>{address}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  line: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  address: {
    color: theme.colors.subtle,
    fontSize: theme.typography.caption,
  },
});
