import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { TouchableFade } from '../components/TouchableFade';
import { FadeModal } from '../components/FadeModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { theme } from '../design/theme';
import { getMyVisits, getPlaceRef } from '../api/client';
import { ApiPlaceRef, ApiVisit } from '../api/types';

type Props = {
  onBackPress: () => void;
};

export function ProfileScreen({ onBackPress }: Props) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [showPolicyType, setShowPolicyType] = useState<
    'terms' | 'privacy' | null
  >(null);
  const [showHistory, setShowHistory] = useState(false);
  const [visits, setVisits] = useState<ApiVisit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [visitPlaces, setVisitPlaces] = useState<Record<number, ApiPlaceRef>>({});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const loadVisits = async () => {
    setVisitsLoading(true);
    try {
      const myVisits = await getMyVisits();
      setVisits(myVisits);

      // Resolve each visited place's reference row (id -> cached name) for display.
      const uniqueIds = Array.from(new Set(myVisits.map(v => v.place_id)));
      const placesMap: Record<number, ApiPlaceRef> = {};
      await Promise.all(
        uniqueIds.map(async id => {
          try {
            placesMap[id] = await getPlaceRef(id);
          } catch (e) {
            // 오류 무시
          }
        }),
      );
      setVisitPlaces(placesMap);
    } catch (error) {
      console.error('Failed to load visits:', error);
    } finally {
      setVisitsLoading(false);
    }
  };

  const handleOpenLink = (url: string) => {
    // TODO: 링크 오픈 구현
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        bounces={false}
        scrollEventThrottle={16}
      >
      {/* 헤더 네비게이션 */}
      <View style={styles.headerNav}>
        <TouchableFade
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={onBackPress}
        >
          <Text style={styles.backButtonText}>← 돌아가기</Text>
        </TouchableFade>
      </View>

      {/* 프로필 카드 */}
      <View style={styles.profileSection}>
        <View style={styles.accentBar} />
        <View style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>
              {(user?.nickname || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.nickname}>{user?.nickname || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      {/* 설정 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>설정</Text>
        <TouchableFade
          style={({ pressed }) => [
            styles.menuCard,
            pressed && styles.menuCardPressed,
          ]}
          onPress={() => {}} // TODO: 설정 화면
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>설정</Text>
            <Text style={styles.menuSubtitle}>앱 설정 및 환경설정</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableFade>
      </View>

      {/* 히스토리 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>활동</Text>
        <TouchableFade
          style={({ pressed }) => [
            styles.menuCard,
            pressed && styles.menuCardPressed,
          ]}
          onPress={() => {
            loadVisits();
            setShowHistory(true);
          }}
        >
          <Text style={styles.menuIcon}>📍</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>방문 기록</Text>
            <Text style={styles.menuSubtitle}>다녀온 음식점 히스토리</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableFade>
      </View>

      {/* 법적 정보 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>법적 정보</Text>
        <TouchableFade
          style={({ pressed }) => [
            styles.menuCard,
            pressed && styles.menuCardPressed,
          ]}
          onPress={() => setShowPolicyType('terms')}
        >
          <Text style={styles.menuIcon}>📋</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>이용약관</Text>
            <Text style={styles.menuSubtitle}>서비스 이용 조건</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableFade>
        <TouchableFade
          style={({ pressed }) => [
            styles.menuCard,
            pressed && styles.menuCardPressed,
          ]}
          onPress={() => setShowPolicyType('privacy')}
        >
          <Text style={styles.menuIcon}>🔒</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>개인정보처리방침</Text>
            <Text style={styles.menuSubtitle}>개인 정보 보호 정책</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableFade>
      </View>

      {/* (로그아웃 버튼은 하단 고정 Footer에서 표시됩니다) */}

      {/* (policy modal moved below so it can overlay the footer) */}

      {/* (history modal moved below so it can overlay the footer) */}
      </ScrollView>

      {/* Modals (rendered as siblings so they overlay the footer) */}
      <FadeModal visible={!!showPolicyType} onDismiss={() => setShowPolicyType(null)}>
        <View>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {showPolicyType === 'terms' ? '이용약관' : '개인정보처리방침'}
            </Text>
            <TouchableFade
              style={({ pressed }) => pressed && styles.closeButtonPressed}
              onPress={() => setShowPolicyType(null)}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableFade>
          </View>

          <ScrollView style={styles.policyTextContainer}>
            {showPolicyType === 'terms' ? (
              <Text style={styles.policyText}>
                {`1. 서비스 약관

본 서비스를 이용함으로써 귀하는 본 약관에 동의하는 것입니다.

2. 사용자 책임

사용자는 자신의 계정 정보를 안전하게 관리할 책임이 있습니다.

3. 서비스 제공

당사는 최선을 다하여 서비스를 제공하나 일부 오류나 중단이 발생할 수 있습니다.

4. 금지 행위

사용자는 다음 행위를 하지 않기로 동의합니다:
- 부정한 행위
- 다른 사용자의 권리 침해
- 불법적인 콘텐츠 공유
- 서비스 방해

5. 책임 제한

당사는 사용자의 손해에 대해 책임을 지지 않습니다.

6. 약관 변경

당사는 언제든지 약관을 변경할 수 있습니다.`}
              </Text>
            ) : (
              <Text style={styles.policyText}>
                {`개인정보처리방침

1. 수집하는 정보

당사는 다음 정보를 수집합니다:
- 이메일 주소
- 닉네임
- 생년월일
- 위치 정보

2. 정보 사용

수집된 정보는 다음 목적으로 사용됩니다:
- 서비스 제공
- 사용자 경험 개선
- 통계 분석

3. 정보 보호

당사는 사용자 정보를 안전하게 보호합니다.

4. 정보 공유

당사는 법이 요구하지 않는 한 제3자와 정보를 공유하지 않습니다.

5. 쿠키 사용

당사는 서비스 개선을 위해 쿠키를 사용할 수 있습니다.

6. 사용자 권리

사용자는 자신의 정보에 대한 접근, 수정, 삭제를 요청할 수 있습니다.

7. 연락처

정보 보호에 관한 문의: contact@tablemate.com`}
              </Text>
            )}
          </ScrollView>

          <TouchableFade
            style={({ pressed }) => [
              styles.modalCloseButton,
              pressed && styles.modalCloseButtonPressed,
            ]}
            onPress={() => setShowPolicyType(null)}
          >
            <Text style={styles.modalCloseButtonText}>닫기</Text>
          </TouchableFade>
        </View>
      </FadeModal>

      <FadeModal visible={showHistory} onDismiss={() => setShowHistory(false)}>
        <View>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>방문 기록</Text>
            <TouchableFade
              style={({ pressed }) => pressed && styles.closeButtonPressed}
              onPress={() => setShowHistory(false)}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableFade>
          </View>

          {visitsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
          ) : visits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>아직 방문 기록이 없습니다</Text>
            </View>
          ) : (
            <ScrollView style={styles.historyContainer}>
              {visits.map(visit => {
                const place = visitPlaces[visit.place_id];
                const arrivedDate = new Date(visit.arrived_at);
                const leftDate = visit.left_at ? new Date(visit.left_at) : null;
                
                return (
                  <View key={visit.id} style={styles.historyCard}>
                    <View style={styles.historyCardContent}>
                      <Text style={styles.placeName}>
                        {place?.name || `장소 #${visit.place_id}`}
                      </Text>
                      <Text style={styles.visitDate}>
                        {arrivedDate.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      {leftDate && (
                        <Text style={styles.visitDuration}>
                          {Math.round(
                            (leftDate.getTime() - arrivedDate.getTime()) / 60000,
                          )}
                          분 방문
                        </Text>
                      )}
                      {visit.feedback_submitted && (
                        <View style={styles.feedbackBadge}>
                          <Text style={styles.feedbackText}>
                            {visit.disliked
                              ? '별로'
                              : `분위기 ${(visit.mood ?? 0).toFixed(1)} · 가격 ${(visit.price ?? 0).toFixed(1)}`}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.historyIcon}>📍</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          <TouchableFade
            style={({ pressed }) => [
              styles.modalCloseButton,
              pressed && styles.modalCloseButtonPressed,
            ]}
            onPress={() => setShowHistory(false)}
          >
            <Text style={styles.modalCloseButtonText}>닫기</Text>
          </TouchableFade>
        </View>
      </FadeModal>

      <FadeModal visible={showLogoutConfirm} onDismiss={() => setShowLogoutConfirm(false)}>
        <View>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>로그아웃</Text>
            <TouchableFade
              style={({ pressed }) => pressed && styles.closeButtonPressed}
              onPress={() => setShowLogoutConfirm(false)}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableFade>
          </View>
          <View style={{ padding: theme.spacing.lg, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.muted, fontSize: theme.typography.body }}>
              로그아웃할까요?
            </Text>
          </View>
          <View style={styles.confirmActions}>
            <TouchableFade
              style={({ pressed }) => [styles.cancelAction, pressed && styles.cancelActionPressed]}
              onPress={() => setShowLogoutConfirm(false)}
            >
              <Text style={styles.cancelActionText}>취소</Text>
            </TouchableFade>
            <TouchableFade
              style={({ pressed }) => [styles.confirmAction, pressed && styles.confirmActionPressed]}
              onPress={async () => {
                setShowLogoutConfirm(false);
                await logout();
              }}
            >
              <Text style={styles.confirmActionText}>로그아웃</Text>
            </TouchableFade>
          </View>
        </View>
      </FadeModal>

      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableFade
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
            { marginHorizontal: theme.spacing.lg },
          ]}
          onPress={() => setShowLogoutConfirm(true)}
        >
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableFade>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerNav: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backButtonText: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  profileSection: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadow.soft,
  },
  accentBar: {
    height: 6,
    backgroundColor: theme.colors.primary,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
  },
  nickname: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.typography.body,
    color: theme.colors.muted,
  },
  section: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  sectionLabel: {
    fontSize: theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.md,
    letterSpacing: 0.5,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.lg,
  },
  menuCardPressed: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  menuSubtitle: {
    fontSize: theme.typography.caption,
    color: theme.colors.muted,
  },
  menuArrow: {
    fontSize: 20,
    color: theme.colors.muted,
  },
  logoutButton: {
    backgroundColor: theme.colors.danger,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    ...theme.shadow.soft,
  },
  logoutButtonPressed: {
    opacity: 0.85,
  },
  logoutButtonText: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 61, 145, 0.48)',
    justifyContent: 'flex-end',
    zIndex: 2000,
    elevation: 30,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '85%',
    overflow: 'hidden',
    ...theme.shadow.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: theme.colors.muted,
    fontWeight: '300',
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
  policyTextContainer: {
    maxHeight: 400,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  policyText: {
    fontSize: theme.typography.body,
    lineHeight: 24,
    color: theme.colors.text,
  },
  modalCloseButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  modalCloseButtonPressed: {
    opacity: 0.85,
  },
  modalCloseButtonText: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
    zIndex: 10,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  historyContainer: {
    maxHeight: 400,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyCardContent: {
    flex: 1,
  },
  placeName: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  visitDate: {
    fontSize: theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
  },
  visitDuration: {
    fontSize: theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  feedbackBadge: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-start',
  },
  feedbackText: {
    fontSize: theme.typography.caption,
    color: theme.colors.textOnPrimary,
    fontWeight: '600',
  },
  historyIcon: {
    fontSize: 28,
    marginLeft: theme.spacing.md,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cancelAction: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelActionPressed: {
    opacity: 0.8,
  },
  cancelActionText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '600',
  },
  confirmAction: {
    flex: 1,
    backgroundColor: theme.colors.danger,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  confirmActionPressed: {
    opacity: 0.9,
  },
  confirmActionText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
});
