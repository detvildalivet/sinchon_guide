import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { ScreenTransition } from './src/components/ScreenTransition';
import { layoutStyles } from './src/design/layout';
import { theme } from './src/design/theme';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { AskScreen } from './src/screens/AskScreen';
import { GuideScreen } from './src/screens/GuideScreen';
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

type Route = 'ask' | 'guide';

function AppContent() {
  const [route, setRoute] = useState<Route>('ask');
  const [picked, setPicked] = useState<Recommendation | null>(null);
  const [need, setNeed] = useState<Need | null>(null);

  const openGuide = (place: Recommendation, chosenNeed: Need) => {
    setPicked(place);
    setNeed(chosenNeed);
    setRoute('guide');
  };

  const backToAsk = () => {
    setPicked(null);
    setNeed(null);
    setRoute('ask');
  };

  const renderScreen = () => {
    if (route === 'guide' && picked !== null && need !== null) {
      return <GuideScreen place={picked} need={need} onBack={backToAsk} />;
    }
    return <AskScreen onGuide={openGuide} />;
  };

  return (
    <View style={[styles.container, layoutStyles.screen]}>
      <ScreenTransition transitionKey={route}>{renderScreen()}</ScreenTransition>
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
