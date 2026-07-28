import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { shellStyles } from '../design/shellStyles';
import { theme } from '../design/theme';
import { useAuth } from '../auth/AuthContext';
import { ApiError, clearVisits, getVisits } from '../api/client';
import { NEED_TYPE_LABELS } from '../constants/needTypes';
import { Visit } from '../types/recommendation';

type Props = {
  onBack: () => void;
  // App.tsx keeps this screen mounted-but-hidden (like GuideScreen) so its
  // crossfade-out has something to animate. That means a plain mount-only
  // fetch would show a stale snapshot forever after the first open — this
  // flag lets the effect below refetch every time the screen becomes visible
  // again, so a visit just recorded (e.g. from GuideScreen's Naver handoff)
  // actually shows up on the next open instead of only after a fresh app launch.
  visible: boolean;
};

// Visit logging (POST /visits) and AuthContext.logout both existed in code
// with no UI surface anywhere in the app — this screen is that surface:
// the user's own visit history (via the new GET /visits) plus account info
// and a way to actually sign out.
export function HistoryScreen({ onBack, visible }: Props) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    getVisits()
      .then(result => {
        if (active) {
          setVisits(result);
        }
      })
      .catch(err => {
        if (active) {
          setError(
            err instanceof ApiError ? err.message : '방문 기록을 불러오지 못했습니다.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [visible]);

  const handleClear = () => {
    Alert.alert(
      '방문 기록을 지우시겠습니까?',
      '지운 기록은 목록에서만 사라집니다. 이후 추천에는 계속 반영됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '지우기',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            setError(null);
            try {
              await clearVisits();
              setVisits([]);
            } catch (err) {
              setError(
                err instanceof ApiError ? err.message : '방문 기록을 지우지 못했습니다.',
              );
            } finally {
              setClearing(false);
            }
          },
        },
      ],
    );
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
      date.getDate(),
    ).padStart(2, '0')}`;
  };

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="돌아가기"
        onPress={onBack}
        style={[shellStyles.promptPanel, styles.backTag, { top: insets.top + theme.spacing.md }]}>
        <Text style={styles.backTagText}>{'< 돌아가기'}</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + theme.spacing.xxl + theme.spacing.xl,
            paddingBottom: insets.bottom + theme.spacing.xl,
          },
        ]}>
        <View style={[shellStyles.promptBox, styles.panel]}>
          <Text style={styles.eyebrow}>내 계정</Text>
          <Text style={styles.nickname}>{user?.nickname ?? '-'}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
          <AppButton label="로그아웃" variant="ghost" onPress={logout} />
        </View>

        <View style={[shellStyles.promptBox, styles.panel]}>
          <View style={styles.panelHeader}>
            <Text style={styles.eyebrow}>방문 기록</Text>
            {!loading && visits.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="기록 지우기"
                onPress={handleClear}
                disabled={clearing}
                hitSlop={8}>
                <Text style={styles.clearText}>
                  {clearing ? '지우는 중…' : '기록 지우기'}
                </Text>
              </Pressable>
            )}
          </View>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : visits.length === 0 ? (
            <Text style={styles.description}>아직 방문 기록이 없습니다.</Text>
          ) : (
            <View style={styles.list}>
              {visits.map((visit, index) => (
                <View key={`${visit.placeId}-${visit.createdAt}-${index}`} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={styles.placeName}>{visit.placeName}</Text>
                    <Text style={styles.rowMeta}>
                      {NEED_TYPE_LABELS[visit.type]} · {formatDate(visit.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backTag: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: undefined,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    zIndex: 20,
  },
  backTagText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  panel: {
    gap: theme.spacing.sm,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  clearText: {
    color: theme.colors.danger,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  nickname: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: '900',
  },
  email: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
  },
  description: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.body,
  },
  list: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  placeName: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '800',
  },
  rowMeta: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
  },
});
