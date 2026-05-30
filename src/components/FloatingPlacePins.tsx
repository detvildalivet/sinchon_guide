import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPinAnchor, getMapPinPoint } from './MapPinAnchor';
import { theme } from '../design/theme';
import { VenueCategory } from '../types/tablemate';

export type PlacePin = {
  id: string;
  name: string;
  meta: string;
  note: string;
  menu: string[];
  top: number;
  left: number;
};

export const places: Record<VenueCategory, PlacePin[]> = {
  restaurant: [
    { id: 'r1', name: '소담한상', meta: '한식 · 6분', note: '든든한 점심으로 좋은 한상 메뉴', menu: ['제육 한상', '된장찌개', '불고기 정식'], top: 39, left: 18 },
    { id: 'r2', name: '멘야 테이블', meta: '라멘 · 9분', note: '혼밥도 편한 바 좌석 중심', menu: ['쇼유 라멘', '차슈덮밥', '교자'], top: 56, left: 64 },
    { id: 'r3', name: '오늘분식', meta: '분식 · 4분', note: '가볍게 나눠 먹기 좋은 분식집', menu: ['떡볶이', '김밥', '튀김 세트'], top: 72, left: 35 },
  ],
  cafe: [
    { id: 'c1', name: '브루 포인트', meta: '커피 · 4분', note: '조용히 대화하기 좋은 창가 자리', menu: ['핸드드립', '바닐라 라떼', '크루아상'], top: 38, left: 61 },
    { id: 'c2', name: '라운드 디저트', meta: '디저트 · 8분', note: '케이크와 커피를 같이 고르기 좋음', menu: ['딸기 케이크', '아메리카노', '피낭시에'], top: 60, left: 21 },
    { id: 'c3', name: '모닝 컵', meta: '라떼 · 5분', note: '짧게 들르기 좋은 가까운 카페', menu: ['카페라떼', '소금빵', '콜드브루'], top: 72, left: 67 },
  ],
  bar: [
    { id: 'b1', name: '노을포차', meta: '맥주 · 7분', note: '편하게 이야기하기 좋은 포차 분위기', menu: ['생맥주', '닭똥집', '해물파전'], top: 42, left: 24 },
    { id: 'b2', name: '바 테이블', meta: '하이볼 · 11분', note: '가볍게 한 잔 하기 좋은 하이볼 바', menu: ['레몬 하이볼', '감바스', '프렌치프라이'], top: 58, left: 66 },
    { id: 'b3', name: '문라이트', meta: '와인 · 9분', note: '조용한 와인 한 잔에 잘 맞는 곳', menu: ['하우스 와인', '치즈 플래터', '브루스케타'], top: 73, left: 42 },
  ],
};

const PLACE_PIN_OFFSET_Y = -12;

export function isTouchNearPlacePin(
  x: number,
  y: number,
  layout: { width: number; height: number },
  category: VenueCategory,
  radius = 56,
) {
  if (layout.width === 0 || layout.height === 0) {
    return false;
  }

  return places[category].some(place => {
    const point = getMapPinPoint(place.top, place.left, layout);
    const dx = x - point.x;
    const dy = y - point.y;

    return Math.hypot(dx, dy) < radius;
  });
}

type Props = {
  category: VenueCategory;
  selectedPlaceId?: string;
  onSelectPlace?: (place: PlacePin) => void;
};

export function FloatingPlacePins({
  category,
  selectedPlaceId,
  onSelectPlace,
}: Props) {
  return (
    <View pointerEvents="box-none" style={styles.layer}>
      {places[category].map((place, index) => (
        <FloatingPin
          key={place.id}
          place={place}
          delay={index * 240}
          selected={place.id === selectedPlaceId}
          onPress={() => onSelectPlace?.(place)}
        />
      ))}
    </View>
  );
}

function FloatingPin({
  place,
  delay,
  selected,
  onPress,
}: {
  place: PlacePin;
  delay: number;
  selected: boolean;
  onPress: () => void;
}) {
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(lift, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(lift, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [delay, lift]);

  return (
    <MapPinAnchor
      top={place.top}
      left={place.left}
      offsetY={PLACE_PIN_OFFSET_Y}
      lift={lift.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -7],
      })}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${place.name} 선택`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pinButton,
          selected && styles.selectedPinButton,
          pressed && styles.pressed,
        ]}>
        <View style={[styles.pinDot, selected && styles.selectedPinDot]} />
        <View style={[styles.pinLabel, selected && styles.selectedPinLabel]}>
          <Text style={styles.pinName}>{place.name}</Text>
          <Text style={styles.pinMeta}>{place.meta}</Text>
        </View>
      </Pressable>
    </MapPinAnchor>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
  },
  pinButton: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    padding: theme.spacing.sm,
  },
  selectedPinButton: {
    backgroundColor: 'rgba(255, 216, 77, 0.24)',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    borderWidth: 4,
    borderColor: theme.colors.surface,
    ...theme.shadow.soft,
  },
  selectedPinDot: {
    width: 24,
    height: 24,
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.primary,
  },
  pinLabel: {
    marginTop: theme.spacing.xs,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    ...theme.shadow.soft,
  },
  selectedPinLabel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.accent,
  },
  pinName: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  pinMeta: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
});
