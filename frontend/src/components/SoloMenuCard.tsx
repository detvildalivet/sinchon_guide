import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../design/theme';
import { SoloMenuRecommendation } from '../types/domain';
import { getCategoryLabel } from '../logic/soloMenuRecommendation';

type Props = {
  recommendation: SoloMenuRecommendation;
};

export function SoloMenuCard({ recommendation }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.menuName}>{recommendation.menuName}</Text>
          <Text style={styles.venueName}>{recommendation.venueName}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreValue}>{recommendation.score}</Text>
          <Text style={styles.scoreLabel}>점</Text>
        </View>
      </View>
      <Text style={styles.reason}>{recommendation.reason}</Text>
      <Text style={styles.description}>{recommendation.description}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{getCategoryLabel(recommendation.category)}</Text>
        <Text style={styles.meta}>{recommendation.distance}</Text>
      </View>
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
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  menuName: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: '900',
  },
  venueName: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  scoreBadge: {
    minWidth: 54,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  scoreValue: {
    color: theme.colors.primary,
    fontSize: theme.typography.heading,
    fontWeight: '900',
    lineHeight: 24,
  },
  scoreLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  reason: {
    marginTop: theme.spacing.md,
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '800',
    lineHeight: 18,
  },
  description: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
    lineHeight: 23,
    marginTop: theme.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  meta: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    fontWeight: '700',
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
