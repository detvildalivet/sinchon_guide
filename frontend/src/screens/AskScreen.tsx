import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { shellStyles } from '../design/shellStyles';
import { theme } from '../design/theme';
import { useUserLocation } from '../hooks/useUserLocation';
import { ApiError, postRecommendations } from '../api/client';
import { Budget, Need, NeedType, Recommendation } from '../types/recommendation';

type Step = 'type' | 'result';

// No Korean place-search provider (Kakao Local, Naver Local Search) exposes
// price-level/menu data via public API the way Google Places did, so budget
// no longer affects ranking (services/recommendation.py's _budget_fit is a
// no-op once price_level is always null) — AskScreen stopped asking for it.
// `Need.budget` stays in the wire contract (still recorded on Visit) with a
// constant neutral value, in case a future data source revives it.
const DEFAULT_BUDGET: Budget = 'mid';

const TYPE_OPTIONS: { value: NeedType; label: string }[] = [
  { value: 'meal', label: '식사' },
  { value: 'cafe', label: '카페' },
  { value: 'drinks', label: '술 한잔' },
  { value: 'dessert', label: '디저트' },
];

type Props = {
  onGuide: (place: Recommendation, need: Need) => void;
};

export function AskScreen({ onGuide }: Props) {
  const insets = useSafeAreaInsets();
  const { center } = useUserLocation();

  const [step, setStep] = useState<Step>('type');
  const [needType, setNeedType] = useState<NeedType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Recommendation[]>([]);
  const [rerollIndex, setRerollIndex] = useState(0);

  const chooseType = async (value: NeedType) => {
    setNeedType(value);
    setLoading(true);
    setError(null);
    setStep('result');
    try {
      const result = await postRecommendations({
        type: value,
        budget: DEFAULT_BUDGET,
        lat: center.latitude,
        lng: center.longitude,
      });
      setCandidates(result);
      setRerollIndex(0);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : '추천을 불러오지 못했어요. 다시 시도해주세요.',
      );
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setNeedType(null);
    setCandidates([]);
    setRerollIndex(0);
    setError(null);
    setStep('type');
  };

  const reroll = () => {
    setRerollIndex(index => Math.min(index + 1, candidates.length - 1));
  };

  const current = candidates[rerollIndex] ?? null;
  const hasMore = rerollIndex + 1 < candidates.length;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + theme.spacing.xl, paddingBottom: insets.bottom + theme.spacing.xl },
      ]}>
      {step === 'type' && (
        <View style={[shellStyles.promptBox, styles.panel]}>
          <Text style={styles.question}>뭐가 필요하세요?</Text>
          <View style={styles.optionGrid}>
            {TYPE_OPTIONS.map(option => (
              <AppButton
                key={option.value}
                label={option.label}
                onPress={() => chooseType(option.value)}
                style={styles.optionButton}
              />
            ))}
          </View>
        </View>
      )}

      {step === 'result' && (
        <View style={[shellStyles.promptBox, styles.panel]}>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} size="large" />
          ) : error ? (
            <>
              <Text style={styles.question}>앗, 문제가 생겼어요</Text>
              <Text style={styles.description}>{error}</Text>
              <AppButton label="처음부터" onPress={startOver} />
            </>
          ) : current ? (
            <>
              <Text style={styles.eyebrow}>추천 장소</Text>
              <Text style={styles.placeName}>{current.name}</Text>
              <Text style={styles.reason}>{current.reason}</Text>
              <View style={styles.actions}>
                <AppButton
                  label="이 장소로 안내"
                  variant="accent"
                  onPress={() =>
                    needType &&
                    onGuide(current, {
                      type: needType,
                      budget: DEFAULT_BUDGET,
                      lat: center.latitude,
                      lng: center.longitude,
                    })
                  }
                />
                {hasMore && (
                  <AppButton label="다시 보기" variant="secondary" onPress={reroll} />
                )}
                <AppButton label="처음부터" variant="ghost" onPress={startOver} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.question}>근처에 마땅한 곳이 없어요</Text>
              <AppButton label="처음부터" onPress={startOver} />
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  panel: {
    gap: theme.spacing.lg,
  },
  question: {
    color: theme.colors.text,
    fontSize: theme.typography.title,
    lineHeight: 36,
    fontWeight: '900',
  },
  description: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  optionButton: {
    flexGrow: 1,
    minWidth: '45%',
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  placeName: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: '900',
  },
  reason: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  actions: {
    gap: theme.spacing.sm,
  },
});
