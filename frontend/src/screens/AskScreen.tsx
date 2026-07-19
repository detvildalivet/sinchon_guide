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

type Step = 'type' | 'budget' | 'result';

const TYPE_OPTIONS: { value: NeedType; label: string }[] = [
  { value: 'meal', label: '식사' },
  { value: 'cafe', label: '카페' },
  { value: 'drinks', label: '술 한잔' },
  { value: 'dessert', label: '디저트' },
];

const BUDGET_OPTIONS: { value: Budget; label: string }[] = [
  { value: 'cheap', label: '가성비' },
  { value: 'mid', label: '적당히' },
  { value: 'splurge', label: '플렉스' },
];

type Props = {
  onGuide: (place: Recommendation, need: Need) => void;
};

export function AskScreen({ onGuide }: Props) {
  const insets = useSafeAreaInsets();
  const { center } = useUserLocation();

  const [step, setStep] = useState<Step>('type');
  const [needType, setNeedType] = useState<NeedType | null>(null);
  const [budget, setBudgetChoice] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Recommendation[]>([]);
  const [rerollIndex, setRerollIndex] = useState(0);

  const chooseType = (value: NeedType) => {
    setNeedType(value);
    setStep('budget');
  };

  const chooseBudget = async (chosenBudget: Budget) => {
    if (!needType) {
      return;
    }
    setBudgetChoice(chosenBudget);
    setLoading(true);
    setError(null);
    try {
      const result = await postRecommendations({
        type: needType,
        budget: chosenBudget,
        lat: center.latitude,
        lng: center.longitude,
      });
      setCandidates(result);
      setRerollIndex(0);
      setStep('result');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : '추천을 불러오지 못했어요. 다시 시도해주세요.',
      );
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setNeedType(null);
    setBudgetChoice(null);
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

      {step === 'budget' && (
        <View style={[shellStyles.promptBox, styles.panel]}>
          <Text style={styles.question}>예산은요?</Text>
          <View style={styles.optionGrid}>
            {BUDGET_OPTIONS.map(option => (
              <AppButton
                key={option.value}
                label={option.label}
                onPress={() => chooseBudget(option.value)}
                style={styles.optionButton}
              />
            ))}
          </View>
          <AppButton label="다시 선택" variant="ghost" onPress={startOver} />
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
                    budget &&
                    onGuide(current, {
                      type: needType,
                      budget,
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
