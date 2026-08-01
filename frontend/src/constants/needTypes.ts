// The backend returns the English identifiers "meal"/"cafe"/"drinks"/
// "dessert" for the 4 curated categories (Kakao's dedicated category-code
// search — see backend/services/places.py's NEED_TYPE_CONFIG); this is
// their Korean label. An open category (anything else the LLM classifier
// extracted, e.g. "당구장") already arrives as a human-readable Korean
// keyword and needs no translation — needTypeLabel falls back to the raw
// string for any key not in this table, which is why HistoryScreen must
// go through it rather than indexing NEED_TYPE_LABELS directly (a plain
// index would render `undefined` for an open category).
export const NEED_TYPE_LABELS: Record<string, string> = {
  meal: '식사',
  cafe: '카페',
  drinks: '술 한잔',
  dessert: '디저트',
};

export function needTypeLabel(type: string): string {
  return NEED_TYPE_LABELS[type] ?? type;
}
