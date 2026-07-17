import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedHint } from '../components/AnimatedHint';
import { AppButton } from '../components/AppButton';
import { AppDialog } from '../components/AppDialog';
import { CardTransition } from '../components/CardTransition';
import { MapStage } from '../components/MapStage';
import { fetchQueueInfo } from '../api/client';
import { TAB_BAR_CLEARANCE, mapLayoutStyles } from '../design/mapLayout';
import { shellStyles } from '../design/shellStyles';
import { theme } from '../design/theme';
import { usePlaceRecommendation } from '../hooks/usePlaceRecommendation';
import { useSoloRecommendations } from '../hooks/useSoloRecommendations';
import { useUserLocation } from '../hooks/useUserLocation';
import { regionAround } from '../services/locationService';
import { HomeTab, PlacePin, SoloMenuRecommendation, VenueCategory } from '../types/sinchonGuide';

type Props = {
  activeTab: HomeTab;
  onProfilePress: () => void;
  onRecommendConfirm: (
    place: PlacePin,
    category: VenueCategory,
    queueId: number | null,
    waitingCount: number,
  ) => void;
};

export function MainHubScreen({ activeTab, onProfilePress, onRecommendConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const isSolo = activeTab === 'solo';
  const modeAnim = useRef(new Animated.Value(isSolo ? 1 : 0)).current;
  const menuPanel = useRef(new Animated.Value(0)).current;
  const [menuIndex, setMenuIndex] = useState(0);
  const [selectedMenu, setSelectedMenu] = useState<SoloMenuRecommendation | null>(
    null,
  );
  const [displayMenu, setDisplayMenu] = useState<SoloMenuRecommendation | null>(
    null,
  );
  const [confirmed, setConfirmed] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const { menus, loading: menusLoading } = useSoloRecommendations();
  const { region, center, loading: locationLoading } = useUserLocation();
  const {
    place: recommendedPlace,
    loading: recommendLoading,
    error: recommendError,
    recommend,
    reroll,
  } = usePlaceRecommendation();
  const visibleMenus = useMemo(() => {
    if (menus.length === 0) {
      return [] as SoloMenuRecommendation[];
    }
    const start = menuIndex % menus.length;

    return [
      menus[start % menus.length],
      menus[(start + 1) % menus.length],
      menus[(start + 2) % menus.length],
    ];
  }, [menuIndex, menus]);
  const currentMenu = selectedMenu ?? visibleMenus[0] ?? null;
  const showNextMenu = () => {
    if (menus.length === 0) {
      return;
    }
    const currentIndex = selectedMenu
      ? menus.findIndex(menu => menu.id === selectedMenu.id)
      : menuIndex;
    const nextIndex = ((currentIndex < 0 ? menuIndex : currentIndex) + 1) % menus.length;

    setMenuIndex(nextIndex);
    setSelectedMenu(menus[nextIndex]);
  };

  const focusRegion = useMemo(() => {
    if (!recommendedPlace) {
      return null;
    }
    return regionAround(
      { latitude: recommendedPlace.latitude, longitude: recommendedPlace.longitude },
      0.01,
      0.01,
    );
  }, [recommendedPlace]);

  const handleRecommend = () => {
    if (recommendLoading) {
      return;
    }
    recommend(center);
  };

  const handleDirections = () => {
    if (!recommendedPlace) {
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${recommendedPlace.latitude},${recommendedPlace.longitude}&destination_place_id=${recommendedPlace.id}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleGoHere = async () => {
    if (!recommendedPlace || queueLoading) {
      return;
    }
    setQueueLoading(true);
    try {
      const info = await fetchQueueInfo(recommendedPlace.id);
      onRecommendConfirm(
        recommendedPlace,
        recommendedPlace.category,
        info.queueId,
        info.waitingCount,
      );
    } catch {
      onRecommendConfirm(recommendedPlace, recommendedPlace.category, null, 0);
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    Animated.timing(modeAnim, {
      toValue: isSolo ? 1 : 0,
      duration: 280,
      useNativeDriver: false,
    }).start();

    if (!isSolo) {
      setSelectedMenu(null);
      return;
    }

    if (menus.length > 0) {
      setSelectedMenu(menus[menuIndex % menus.length]);
    }
  }, [isSolo, menuIndex, menus, modeAnim]);

  useEffect(() => {
    if (selectedMenu) {
      setDisplayMenu(selectedMenu);
    }

    Animated.timing(menuPanel, {
      toValue: selectedMenu ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !selectedMenu) {
        setDisplayMenu(null);
      }
    });
  }, [menuPanel, selectedMenu]);

  const promptBackground = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.88)', 'rgba(15, 61, 145, 0.9)'],
  });
  const promptBorder = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.96)', 'rgba(255, 216, 77, 0.28)'],
  });
  const kickerBackground = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(15, 76, 207, 0.08)', 'rgba(255, 216, 77, 0.18)'],
  });
  const kickerColor = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.primary, theme.colors.accent],
  });
  const titleColor = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.text, theme.colors.textOnPrimary],
  });
  const descriptionColor = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.muted, '#DCE6FF'],
  });

  return (
    <View style={[mapLayoutStyles.screenRoot, shellStyles.screen, { paddingTop: insets.top }]}>
      <View style={[styles.headerWrapper, { top: insets.top + theme.spacing.xs }]}>
        <Animated.View
          pointerEvents="auto"
          style={[
            shellStyles.promptPanel,
            styles.headerPromptPanel,
            {
              backgroundColor: promptBackground,
              borderColor: promptBorder,
            },
          ]}>
          <Animated.Text
            style={[
              shellStyles.panelKicker,
              {
                backgroundColor: kickerBackground,
                color: kickerColor,
              },
            ]}>
            Sinchon Guide
          </Animated.Text>
          <Animated.Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            style={[shellStyles.panelTitle, styles.panelTitle, { color: titleColor }]}>
            {isSolo ? '혼자 먹기 좋은 메뉴' : '같이 먹을 곳을 골라볼까요?'}
          </Animated.Text>
          <Animated.Text
            style={[shellStyles.panelDescription, { color: descriptionColor }]}>
            {isSolo
              ? '시간대와 거리, 혼밥 적합도로 추천해요. 다른 메뉴 버튼으로 바꿔보세요.'
              : '추천 받기를 누르면 오늘 갈 곳 하나를 골라드려요.'}
          </Animated.Text>
          <AnimatedHint
            text={
              isSolo
                ? '다른 메뉴 버튼으로 추천을 바꿔요'
                : '혼자 먹을 메뉴는 하단 혼밥 추천에서 확인해요'
            }
          />
        </Animated.View>

        <View style={styles.profileRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="프로필"
            onPress={onProfilePress}
            style={({ pressed }) => [
              styles.profileButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.profileIcon}>👤</Text>
          </Pressable>
        </View>
      </View>

      <MapStage
        solo={isSolo}
        loading={locationLoading}
        region={region}
        recommendedPlace={!isSolo ? recommendedPlace : null}
        focusRegion={!isSolo ? focusRegion : null}
      />

      {isSolo && menusLoading ? (
        <View style={styles.menuLoading} pointerEvents="none">
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      ) : null}

      {isSolo ? (
        <Animated.View
          pointerEvents={selectedMenu ? 'auto' : 'none'}
          style={[
            shellStyles.bottomPanel,
            styles.menuPanel,
            {
              bottom: insets.bottom + TAB_BAR_CLEARANCE,
              paddingBottom: theme.spacing.sm,
              opacity: menuPanel,
              transform: [
                {
                  translateY: menuPanel.interpolate({
                    inputRange: [0, 1],
                    outputRange: [46, 0],
                  }),
                },
              ],
            },
          ]}>
          {displayMenu ? (
            <CardTransition transitionKey={displayMenu.id}>
              <View style={styles.menuPanelContent}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewKicker}>추천 메뉴</Text>
                  <Text style={styles.previewMeta}>{displayMenu.score}점</Text>
                </View>
                <Text style={styles.previewName}>{displayMenu.menuName}</Text>
                <Text style={styles.previewVenue}>{displayMenu.venueName}</Text>
                <Text style={styles.previewNote}>{displayMenu.reason}</Text>
                <View style={styles.menuRow}>
                  {displayMenu.tags.map(tag => (
                    <View key={tag} style={styles.menuChip}>
                      <Text style={styles.menuText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.actionRow}>
                  <AppButton
                    label="다른 메뉴"
                    onPress={showNextMenu}
                    variant="secondary"
                    style={styles.secondaryAction}
                  />
                  <AppButton
                    label="이 메뉴로 할게요"
                    onPress={() => setConfirmed(true)}
                    variant="accent"
                    style={styles.primaryAction}
                  />
                </View>
              </View>
            </CardTransition>
          ) : null}
        </Animated.View>
      ) : null}

      {!isSolo && !recommendedPlace ? (
        <View
          style={[styles.recommendCta, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}
          pointerEvents="box-none">
          <AppButton
            label={recommendLoading ? '추천 중...' : '추천 받기'}
            onPress={handleRecommend}
            variant="accent"
          />
          {recommendError ? (
            <Text style={styles.recommendError}>{recommendError}</Text>
          ) : null}
        </View>
      ) : null}

      {!isSolo && recommendedPlace ? (
        <View
          style={[
            shellStyles.bottomPanel,
            styles.menuPanel,
            {
              bottom: insets.bottom + TAB_BAR_CLEARANCE,
              paddingBottom: theme.spacing.sm,
            },
          ]}>
          <CardTransition transitionKey={recommendedPlace.id}>
            <View style={styles.menuPanelContent}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewKicker}>추천 장소</Text>
                <Text style={styles.previewMeta}>{recommendedPlace.meta}</Text>
              </View>
              <Text style={styles.previewName}>{recommendedPlace.name}</Text>
              {recommendedPlace.note ? (
                <Text style={styles.previewNote}>{recommendedPlace.note}</Text>
              ) : null}
              <View style={styles.actionRow}>
                <AppButton
                  label="다른 곳 추천"
                  onPress={reroll}
                  variant="secondary"
                  style={styles.secondaryAction}
                />
                <AppButton
                  label="길 안내"
                  onPress={handleDirections}
                  variant="secondary"
                  style={styles.secondaryAction}
                />
              </View>
              <AppButton
                label={queueLoading ? '이동 중...' : '여기로 갈래요'}
                onPress={handleGoHere}
                variant="accent"
                style={styles.primaryActionFull}
              />
            </View>
          </CardTransition>
        </View>
      ) : null}

      <AppDialog
        visible={confirmed && currentMenu !== null}
        title="메뉴 선택 완료"
        message={
          currentMenu
            ? `${currentMenu.venueName} · ${currentMenu.menuName}로 정했어요.`
            : ''
        }
        confirmLabel="확인"
        cancelLabel="닫기"
        onConfirm={() => setConfirmed(false)}
        onCancel={() => setConfirmed(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panelTitle: {
    width: '100%',
  },
  menuLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.98)',
  },
  headerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 15,
  },
  headerPromptPanel: {
    position: 'relative',
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1,
  },
  menuPanelContent: {
    gap: theme.spacing.xs,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  previewKicker: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  previewMeta: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  previewName: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: '900',
  },
  previewVenue: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  previewNote: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    lineHeight: 18,
    fontWeight: '700',
  },
  menuRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  menuChip: {
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(15, 76, 207, 0.08)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  menuText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  primaryAction: {
    flex: 1.25,
  },
  primaryActionFull: {
    marginTop: theme.spacing.sm,
  },
  secondaryAction: {
    flex: 1,
  },
  recommendCta: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  recommendError: {
    color: theme.colors.danger,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.soft,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  profileIcon: {
    fontSize: 24,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
