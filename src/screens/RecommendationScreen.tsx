import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedHint } from '../components/AnimatedHint';
import { AppDialog } from '../components/AppDialog';
import { BottomActionBar } from '../components/BottomActionBar';
import { CardTransition } from '../components/CardTransition';
import { PhaseIndicator } from '../components/PhaseIndicator';
import { RecommendationCard } from '../components/RecommendationCard';
import { layoutStyles } from '../design/layout';
import { theme } from '../design/theme';
import { Recommendation, VenueCategory } from '../types/tablemate';

const recommendations: Recommendation[] = [
  {
    id: 'r1',
    category: 'restaurant',
    name: '소담한상',
    description: '깔끔한 한식 정식과 혼밥 좌석이 있는 곳',
    distance: '도보 6분',
    tags: ['한식', '든든함', '혼밥'],
  },
  {
    id: 'r2',
    category: 'restaurant',
    name: '멘야 테이블',
    description: '빠르게 먹기 좋은 라멘과 사이드 메뉴 구성',
    distance: '도보 9분',
    tags: ['라멘', '빠른 식사', '따뜻함'],
  },
  {
    id: 'c1',
    category: 'cafe',
    name: '브루 포인트',
    description: '조용한 좌석과 산미 있는 필터 커피가 좋은 카페',
    distance: '도보 4분',
    tags: ['커피', '조용함', '작업'],
  },
  {
    id: 'c2',
    category: 'cafe',
    name: '라운드 디저트',
    description: '케이크와 라떼 조합이 좋은 캐주얼 카페',
    distance: '도보 8분',
    tags: ['디저트', '라떼', '휴식'],
  },
  {
    id: 'b1',
    category: 'bar',
    name: '노을포차',
    description: '가벼운 안주와 맥주 한 잔 하기 좋은 술집',
    distance: '도보 7분',
    tags: ['맥주', '안주', '가벼움'],
  },
  {
    id: 'b2',
    category: 'bar',
    name: '바 테이블',
    description: '조용한 분위기의 하이볼과 간단한 플레이트',
    distance: '도보 11분',
    tags: ['하이볼', '조용함', '바'],
  },
];

type Props = {
  category: VenueCategory;
  onBack: () => void;
};

export function RecommendationScreen({ category, onBack }: Props) {
  const options = useMemo(
    () => recommendations.filter(item => item.category === category),
    [category],
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(false);
  const current = options[index % options.length];

  return (
    <View style={layoutStyles.content}>
      <View style={styles.stack}>
        <View style={styles.header}>
          <Text style={styles.kicker}>혼자 모드</Text>
          <Text style={styles.title}>이 정도면 괜찮을까요?</Text>
          <Text style={styles.description}>
            추천은 가볍게 넘기고, 마음이 가는 곳만 선택하세요.
          </Text>
          <AnimatedHint text="다른 곳을 누르면 추천이 부드럽게 바뀝니다" />
        </View>
        <PhaseIndicator current={3} total={3} label="3. 장소 결정" />
        <CardTransition transitionKey={current.id}>
          <RecommendationCard recommendation={current} />
        </CardTransition>
      </View>
      <BottomActionBar
        secondary={{
          label: '다른 곳',
          onPress: () => setIndex(value => value + 1),
          variant: 'secondary',
        }}
        primary={{ label: '여기로 할게요', onPress: () => setSelected(true), variant: 'accent' }}
      />
      <AppDialog
        visible={selected}
        title="선택 완료"
        message={`${current.name}로 정했어요.`}
        confirmLabel="홈으로"
        cancelLabel="닫기"
        onConfirm={onBack}
        onCancel={() => setSelected(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.backgroundDeep,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
    ...theme.shadow.soft,
  },
  kicker: {
    alignSelf: 'flex-start',
    color: theme.colors.text,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  title: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.title,
    lineHeight: 38,
    fontWeight: '900',
  },
  description: {
    color: '#DCE6FF',
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
});
