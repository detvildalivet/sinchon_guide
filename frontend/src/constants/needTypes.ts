import { NeedType } from '../types/recommendation';

// Single source of truth for the Korean label per need type — used by
// AskScreen's picker buttons and HistoryScreen's visit-history rows, so the
// two screens can't drift out of sync on wording.
export const NEED_TYPE_LABELS: Record<NeedType, string> = {
  meal: '식사',
  cafe: '카페',
  drinks: '술 한잔',
  dessert: '디저트',
};

export const TYPE_OPTIONS: { value: NeedType; label: string }[] = (
  Object.keys(NEED_TYPE_LABELS) as NeedType[]
).map(value => ({ value, label: NEED_TYPE_LABELS[value] }));
