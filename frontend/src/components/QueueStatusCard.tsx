import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { theme } from '../design/theme';
import { QueueMode } from '../types/domain';

type Props = {
  mode: QueueMode;
  waitingCount: number;
  compact?: boolean;
};

export function QueueStatusCard({ mode, waitingCount, compact = false }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    fade.setValue(0);
    slide.setValue(12);

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, mode, slide, waitingCount]);

  const exists = mode === 'join';

  return (
    <Animated.View
      style={[
        styles.box,
        compact && styles.compactBox,
        { opacity: fade, transform: [{ translateY: slide }] },
      ]}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {exists ? 'MATCH READY' : 'NEW QUEUE'}
        </Text>
      </View>
      <Text style={[styles.status, compact && styles.compactStatus]}>
        {exists
          ? `현재 ${waitingCount}명 대기 중`
          : '아직 열린 큐가 없어요'}
      </Text>
      <Text style={styles.hint}>
        {exists
          ? '조인하면 바로 임시 채팅방이 열려요.'
          : '첫 큐를 만들면 다른 사람이 조인할 수 있어요.'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceAlt,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  compactBox: {
    marginTop: theme.spacing.sm,
  },
  badge: {
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(15, 76, 207, 0.08)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  status: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  compactStatus: {
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  hint: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
