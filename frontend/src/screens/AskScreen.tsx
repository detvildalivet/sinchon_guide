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
import { IconButton } from '../components/IconButton';
import { OpenStatusBadge } from '../components/OpenStatusBadge';
import { PlaceMeta } from '../components/PlaceMeta';
import { RatingStars } from '../components/RatingStars';
import { TouchableFade } from '../components/TouchableFade';
import { shellStyles } from '../design/shellStyles';
import { theme } from '../design/theme';
import { useUserLocation } from '../hooks/useUserLocation';
import { ApiError, postRecommendations } from '../api/client';
import { TYPE_OPTIONS } from '../constants/needTypes';
import { Budget, Need, NeedType, Recommendation } from '../types/recommendation';

type Step = 'type' | 'result';

// No Korean place-search provider gives budget a real chance to matter:
// Kakao has no price data at all, and Google Places' priceLevel (fetched
// briefly by services/enrichment.py) turned out too sparse in practice —
// live testing showed changing budget almost never changed the
// recommendation. `Need.budget` stays in the wire contract (still recorded
// on Visit, forward-compatible if a data source ever revives it) with a
// constant neutral value — only the UI question is gone. See
// services/recommendation.py's module docstring for the full story.
const DEFAULT_BUDGET: Budget = 'mid';

type Props = {
  onGuide: (place: Recommendation, need: Need) => void;
  onOpenHistory: () => void;
};

export function AskScreen({ onGuide, onOpenHistory }: Props) {
  const insets = useSafeAreaInsets();
  const { center } = useUserLocation();

  const [step, setStep] = useState<Step>('type');
  const [needType, setNeedType] = useState<NeedType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Recommendation[]>([]);

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
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : '추천을 불러오지 못했습니다. 다시 시도해 주십시오.',
      );
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    if (needType) {
      chooseType(needType);
    }
  };

  const startOver = () => {
    setNeedType(null);
    setCandidates([]);
    setError(null);
    setStep('type');
  };

  const guideTo = (place: Recommendation) => {
    if (!needType) {
      return;
    }
    onGuide(place, {
      type: needType,
      budget: DEFAULT_BUDGET,
      lat: center.latitude,
      lng: center.longitude,
    });
  };

  const hero = candidates[0] ?? null;
  const rest = candidates.slice(1);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + theme.spacing.xl, paddingBottom: insets.bottom + theme.spacing.xl },
      ]}>
      <View style={styles.header}>
        <IconButton label="방문 기록" icon="☰" onPress={onOpenHistory} />
      </View>

      {step === 'type' && (
        <View style={[shellStyles.promptBox, styles.panel]}>
          <Text style={styles.question}>무엇이 필요하십니까?</Text>
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
              <Text style={styles.question}>문제가 생겼습니다</Text>
              <Text style={styles.description}>{error}</Text>
              <View style={styles.actions}>
                <AppButton label="다시 시도" onPress={retry} />
                <AppButton label="처음부터" variant="ghost" onPress={startOver} />
              </View>
            </>
          ) : hero ? (
            <>
              <Text style={styles.eyebrow}>추천 장소</Text>
              <Text style={styles.placeName}>{hero.name}</Text>
              <RatingStars rating={hero.rating} ratingCount={hero.ratingCount} />
              <OpenStatusBadge openNow={hero.openNow} />
              <PlaceMeta distanceMinutes={hero.distanceMinutes} category={hero.category} />
              <Text style={styles.reason}>{hero.reason}</Text>
              <View style={styles.actions}>
                <AppButton label="이 장소로 안내" variant="accent" onPress={() => guideTo(hero)} />
                <AppButton label="처음부터" variant="ghost" onPress={startOver} />
              </View>

              {rest.length > 0 && (
                <View style={styles.candidateList}>
                  <Text style={styles.candidateListTitle}>다른 후보</Text>
                  {rest.map(candidate => (
                    <TouchableFade
                      key={candidate.placeId}
                      onPress={() => guideTo(candidate)}
                      style={styles.candidateRow}>
                      <View style={styles.candidateMain}>
                        <Text style={styles.candidateName}>{candidate.name}</Text>
                        <PlaceMeta
                          distanceMinutes={candidate.distanceMinutes}
                          category={candidate.category}
                        />
                        <RatingStars rating={candidate.rating} ratingCount={candidate.ratingCount} />
                      </View>
                      <OpenStatusBadge openNow={candidate.openNow} />
                    </TouchableFade>
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.question}>근처에 마땅한 곳이 없습니다</Text>
              <Text style={styles.description}>다른 종류로 찾아보시겠습니까?</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  candidateList: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  candidateListTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '800',
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  candidateMain: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  candidateName: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '800',
  },
});
