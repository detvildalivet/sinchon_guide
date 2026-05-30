import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../design/theme';
import { Recommendation } from '../types/tablemate';

type Props = {
  recommendation: Recommendation;
};

export function RecommendationCard({ recommendation }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.header}>
        <Text style={styles.name}>{recommendation.name}</Text>
        <Text style={styles.distance}>{recommendation.distance}</Text>
      </View>
      <Text style={styles.description}>{recommendation.description}</Text>
      <View style={styles.tags}>
        {recommendation.tags.map(tag => (
          <Text key={tag} style={styles.tag}>
            {tag}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    overflow: 'hidden',
    ...theme.shadow.soft,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: theme.colors.accent,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  name: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: '800',
  },
  distance: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '700',
    paddingTop: 5,
  },
  description: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
    lineHeight: 23,
    marginTop: theme.spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  tag: {
    color: theme.colors.primary,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
});
