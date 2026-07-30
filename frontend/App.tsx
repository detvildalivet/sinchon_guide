import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { CrossfadeSwitch } from './src/components/CrossfadeSwitch';
import { layoutStyles } from './src/design/layout';
import { theme } from './src/design/theme';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { AskScreen } from './src/screens/AskScreen';
import { GuideScreen } from './src/screens/GuideScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { postVisit } from './src/api/client';
import { Need, Recommendation } from './src/types/recommendation';

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

type Route = 'ask' | 'guide' | 'history';

function AppContent() {
  const [route, setRoute] = useState<Route>('ask');
  const [picked, setPicked] = useState<Recommendation | null>(null);
  const [need, setNeed] = useState<Need | null>(null);
  const [hasOpenedHistory, setHasOpenedHistory] = useState(false);
  // Counter (not boolean) passed to AskScreen as resetToken: incrementing it
  // is how goHome() below tells the always-mounted AskScreen to reset itself
  // back to its 'type' step, since nothing about switching `route` back to
  // 'ask' does that on its own (see backToAsk).
  const [askResetToken, setAskResetToken] = useState(0);

  const openGuide = (place: Recommendation, chosenNeed: Need) => {
    setPicked(place);
    setNeed(chosenNeed);
    setRoute('guide');

    // Record the visit as soon as the user commits to being guided to this
    // place — not gated on the external Naver Maps handoff (GuideScreen's
    // "네이버 지도로 안내" button), since a user who only ever uses the in-app
    // map/route should still see the place in their History. Best-effort:
    // never blocks the route switch above.
    postVisit({
      placeId: place.placeId,
      placeName: place.name,
      type: chosenNeed.type,
    }).catch(() => {});
  };

  const openHistory = () => {
    setHasOpenedHistory(true);
    setRoute('history');
  };

  // Only flips the route — picked/need are deliberately left set so
  // GuideScreen stays mounted (just hidden) instead of being torn down.
  // AskScreen is always mounted (see below), so "다시 추천받기" naturally
  // lands back on whatever AskScreen was showing, not a fresh restart.
  const backToAsk = () => {
    setRoute('ask');
  };

  // Unlike backToAsk, this is a deliberate reset: it's the 홈 button's only
  // path back to AskScreen's actual home ('type') step, not just "whatever
  // AskScreen was last showing". picked/need are still left alone so
  // GuideScreen stays mounted-but-hidden, same as backToAsk.
  const goHome = () => {
    setAskResetToken(token => token + 1);
    setRoute('ask');
  };

  return (
    <View style={[styles.container, layoutStyles.screen]}>
      <AskScreen onGuide={openGuide} onOpenHistory={openHistory} resetToken={askResetToken} />
      <CrossfadeSwitch visible={route === 'guide'}>
        {picked && need && <GuideScreen place={picked} onBack={backToAsk} onGoHome={goHome} />}
      </CrossfadeSwitch>
      <CrossfadeSwitch visible={route === 'history'}>
        {hasOpenedHistory && (
          <HistoryScreen onBack={backToAsk} visible={route === 'history'} />
        )}
      </CrossfadeSwitch>
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
