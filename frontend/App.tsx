import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { MainTabBar } from './src/components/MainTabBar';
import { ScreenTransition } from './src/components/ScreenTransition';
import { layoutStyles } from './src/design/layout';
import { theme } from './src/design/theme';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { MainHubScreen } from './src/screens/MainHubScreen';
import { PreferenceScreen } from './src/screens/PreferenceScreen';
import { QueueScreen } from './src/screens/QueueScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { HomeTab, PlacePin, QueueMode, VenueCategory } from './src/types/sinchonGuide';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={[styles.container, styles.splash]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!token) {
    return <AuthScreen />;
  }

  return <AppContent />;
}

type SelectedQueue = {
  queueId: number | null;
  waitingCount: number;
};

function AppContent() {
  const [route, setRoute] = useState<'home' | 'preference' | 'queue' | 'profile'>('home');
  const [homeTab, setHomeTab] = useState<HomeTab>('together');
  const [category, setCategory] = useState<VenueCategory | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlacePin | null>(null);
  const [queueMode, setQueueMode] = useState<QueueMode>('join');
  const [selectedQueue, setSelectedQueue] = useState<SelectedQueue>({
    queueId: null,
    waitingCount: 0,
  });

  const goHome = () => {
    setRoute('home');
    setCategory(null);
    setSelectedPlace(null);
  };

  const openQueue = (
    place: PlacePin,
    mode: QueueMode,
    queueId: number | null,
    waitingCount: number,
  ) => {
    setSelectedPlace(place);
    setQueueMode(mode);
    setSelectedQueue({ queueId, waitingCount });
    setRoute('queue');
  };

  const handleRecommendConfirm = (
    place: PlacePin,
    recommendedCategory: VenueCategory,
    queueId: number | null,
    waitingCount: number,
  ) => {
    setCategory(recommendedCategory);
    openQueue(place, queueId ? 'join' : 'create', queueId, waitingCount);
  };

  const renderScreen = () => {
    if (route === 'home' && category === null) {
      return (
        <MainHubScreen
          activeTab={homeTab}
          onProfilePress={() => setRoute('profile')}
          onRecommendConfirm={handleRecommendConfirm}
        />
      );
    }

    if (route === 'profile') {
      return <ProfileScreen onBackPress={() => setRoute('home')} />;
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
      return (
        <QueueScreen
          category={category}
          placeName={selectedPlace.name}
          placeGoogleId={selectedPlace.id}
          mode={queueMode}
          queueId={selectedQueue.queueId}
          initialWaitingCount={selectedQueue.waitingCount}
          onBack={() => setRoute('preference')}
        />
      );
    }

    return null;
  };

  const showMainTabBar = route === 'home' && category === null;

  return (
    <View style={[styles.container, layoutStyles.screen]}>
      <ScreenTransition transitionKey={`${route}-${category ?? 'none'}`}>
        {renderScreen()}
      </ScreenTransition>
      {showMainTabBar ? (
        <MainTabBar active={homeTab} onChange={setHomeTab} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splash: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
});

export default App;
