import { SoloMenuRecommendation, VenueCategory } from '../types/tablemate';

type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'late';

type MenuCandidate = Omit<SoloMenuRecommendation, 'score' | 'reason'> & {
  soloScore: number;
  mealSlot: MealSlot;
  distanceMinutes: number;
};

const menuPool: MenuCandidate[] = [
  {
    id: 'sm1',
    menuName: '제육 한상',
    venueName: '소담한상',
    category: 'restaurant',
    description: '혼자 먹기 좋은 한상 구성이라 부담 없이 든든해요.',
    distance: '도보 6분',
    tags: ['한식', '든든함', '혼밥'],
    soloScore: 82,
    mealSlot: 'lunch',
    distanceMinutes: 6,
  },
  {
    id: 'sm2',
    menuName: '쇼유 라멘',
    venueName: '멘야 테이블',
    category: 'restaurant',
    description: '바 좌석 위주라 빠르게 혼자 먹기 좋아요.',
    distance: '도보 9분',
    tags: ['라멘', '빠른 식사', '혼밥'],
    soloScore: 88,
    mealSlot: 'dinner',
    distanceMinutes: 9,
  },
  {
    id: 'sm3',
    menuName: '떡볶이 세트',
    venueName: '오늘분식',
    category: 'restaurant',
    description: '가볍게 한 끼 때우기 좋은 분식 메뉴예요.',
    distance: '도보 4분',
    tags: ['분식', '가벼움', '혼밥'],
    soloScore: 74,
    mealSlot: 'snack',
    distanceMinutes: 4,
  },
  {
    id: 'sm4',
    menuName: '핸드드립',
    venueName: '브루 포인트',
    category: 'cafe',
    description: '조용한 창가 자리에서 천천히 즐기기 좋아요.',
    distance: '도보 4분',
    tags: ['커피', '조용함', '작업'],
    soloScore: 79,
    mealSlot: 'snack',
    distanceMinutes: 4,
  },
  {
    id: 'sm5',
    menuName: '딸기 케이크 세트',
    venueName: '라운드 디저트',
    category: 'cafe',
    description: '디저트 한 판으로 기분 전환하기 좋아요.',
    distance: '도보 8분',
    tags: ['디저트', '휴식', '혼밥'],
    soloScore: 76,
    mealSlot: 'snack',
    distanceMinutes: 8,
  },
  {
    id: 'sm6',
    menuName: '카페라떼 + 소금빵',
    venueName: '모닝 컵',
    category: 'cafe',
    description: '짧게 들러 혼자 채우기 좋은 조합이에요.',
    distance: '도보 5분',
    tags: ['라떼', '간단', '혼밥'],
    soloScore: 81,
    mealSlot: 'breakfast',
    distanceMinutes: 5,
  },
  {
    id: 'sm7',
    menuName: '생맥주 + 해물파전',
    venueName: '노을포차',
    category: 'bar',
    description: '혼자 앉아 가볍게 한 잔하기 좋은 안주예요.',
    distance: '도보 7분',
    tags: ['맥주', '안주', '가벼움'],
    soloScore: 70,
    mealSlot: 'dinner',
    distanceMinutes: 7,
  },
  {
    id: 'sm8',
    menuName: '레몬 하이볼',
    venueName: '바 테이블',
    category: 'bar',
    description: '바 좌석에서 조용히 마시기 좋은 메뉴예요.',
    distance: '도보 11분',
    tags: ['하이볼', '조용함', '혼밥'],
    soloScore: 77,
    mealSlot: 'late',
    distanceMinutes: 11,
  },
];

function getMealSlot(hour: number): MealSlot {
  if (hour >= 7 && hour < 10) {
    return 'breakfast';
  }
  if (hour >= 11 && hour < 14) {
    return 'lunch';
  }
  if (hour >= 14 && hour < 17) {
    return 'snack';
  }
  if (hour >= 17 && hour < 22) {
    return 'dinner';
  }

  return 'late';
}

function buildReason(item: MenuCandidate, hour: number): string {
  const slot = getMealSlot(hour);
  const slotLabels: Record<MealSlot, string> = {
    breakfast: '아침',
    lunch: '점심',
    snack: '오후',
    dinner: '저녁',
    late: '늦은 시간',
  };

  if (item.mealSlot === slot) {
    return `${slotLabels[slot]} 시간대에 잘 맞는 혼밥 메뉴예요.`;
  }

  if (item.tags.includes('혼밥')) {
    return '혼자 먹기 편한 메뉴로 점수가 높아요.';
  }

  return '가까운 거리와 메뉴 구성을 기준으로 추천했어요.';
}

function scoreMenu(item: MenuCandidate, hour: number): number {
  const slot = getMealSlot(hour);
  let score = item.soloScore;

  if (item.mealSlot === slot) {
    score += 18;
  } else if (
    (slot === 'lunch' || slot === 'dinner') &&
    (item.mealSlot === 'lunch' || item.mealSlot === 'dinner')
  ) {
    score += 8;
  }

  score -= item.distanceMinutes * 0.6;

  if (item.tags.includes('혼밥')) {
    score += 6;
  }

  if (item.tags.includes('빠른 식사') && (slot === 'lunch' || slot === 'snack')) {
    score += 5;
  }

  return Math.round(score * 10) / 10;
}

export function recommendSoloMenus(
  hour = new Date().getHours(),
  limit = 6,
): SoloMenuRecommendation[] {
  return menuPool
    .map(item => {
      const score = scoreMenu(item, hour);

      return {
        id: item.id,
        menuName: item.menuName,
        venueName: item.venueName,
        category: item.category,
        description: item.description,
        distance: item.distance,
        tags: item.tags,
        score,
        reason: buildReason(item, hour),
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function getCategoryLabel(category: VenueCategory) {
  const labels: Record<VenueCategory, string> = {
    restaurant: '음식점',
    cafe: '카페',
    bar: '술집',
  };

  return labels[category];
}
