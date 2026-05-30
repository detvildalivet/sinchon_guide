import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { AppDialog } from './src/components/AppDialog';
import { MainTabBar } from './src/components/MainTabBar';
import { ScreenTransition } from './src/components/ScreenTransition';
import { TopNav } from './src/components/TopNav';
import { PlacePin } from './src/components/FloatingPlacePins';
import { layoutStyles } from './src/design/layout';
import { theme } from './src/design/theme';
import { getQueueInfo } from './src/logic/queueService';
import { MainHubScreen } from './src/screens/MainHubScreen';
import { PreferenceScreen } from './src/screens/PreferenceScreen';
import { QueueScreen } from './src/screens/QueueScreen';
import { AppRoute, HomeTab, QueueMode, VenueCategory } from './src/types/tablemate';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [homeTab, setHomeTab] = useState<HomeTab>('together');
  const [category, setCategory] = useState<VenueCategory | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlacePin | null>(null);
  const [queueMode, setQueueMode] = useState<QueueMode>('join');
  const [dialog, setDialog] = useState<'profile' | 'map' | null>(null);

  const goHome = () => {
    setRoute('home');
    setCategory(null);
    setSelectedPlace(null);
  };

  const selectCategory = (nextCategory: VenueCategory) => {
    setCategory(nextCategory);
    setRoute('preference');
  };

  const openQueue = (place: PlacePin, mode: QueueMode) => {
    setSelectedPlace(place);
    setQueueMode(mode);
    setRoute('queue');
  };

  const renderScreen = () => {
    if (route === 'home' && category === null) {
      return (
        <MainHubScreen
          activeTab={homeTab}
          onSelectCategory={selectCategory}
        />
      );
    }

    if (route === 'preference' && category !== null) {
      return (
        <PreferenceScreen
          category={category}
          onQueue={openQueue}
          onHomePress={goHome}
          onCategoryChange={setCategory}
        />
      );
    }

    if (route === 'queue' && category !== null && selectedPlace !== null) {
      const queueInfo = getQueueInfo(selectedPlace.id);

      return (
        <QueueScreen
          category={category}
          placeName={selectedPlace.name}
          mode={queueMode}
          waitingCount={queueInfo.waitingCount}
        />
      );
    }

    return (
      <MainHubScreen
        activeTab={homeTab}
        onSelectCategory={selectCategory}
      />
    );
  };

  const showMainTabBar = route === 'home' && category === null;

  return (
    <View style={[styles.container, layoutStyles.screen]}>
      {route !== 'home' && route !== 'preference' && category !== null ? (
        <TopNav
          onHomePress={goHome}
          onProfilePress={() => setDialog('profile')}
          onMapPress={() => setDialog('map')}
        />
      ) : null}
      <ScreenTransition transitionKey={`${route}-${category ?? 'none'}`}>
        {renderScreen()}
      </ScreenTransition>
      {showMainTabBar ? (
        <MainTabBar active={homeTab} onChange={setHomeTab} />
      ) : null}
      <AppDialog
        visible={dialog === 'profile'}
        title="프로필"
        message="게스트 · 선호 거리 1km · 알레르기 미설정"
        confirmLabel="확인"
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
      <AppDialog
        visible={dialog === 'map'}
        title="지도"
        message="주변 후보 6곳 · 음식점 2 · 카페 2 · 술집 2"
        confirmLabel="확인"
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
