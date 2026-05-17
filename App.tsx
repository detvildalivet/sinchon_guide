import { useState } from 'react';

import HomeScreen, { type PlaceCategory } from './src/screens/HomeScreen.tsx';
import JoinOrCreateScreen from './src/screens/JoinOrCreate.tsx';
import JoinScreen from './src/screens/join.tsx';
import MapScreen from './src/screens/MapScreen.tsx';
import TogetherScreen from './src/screens/Together.tsx';

type Screen = 'home' | 'together' | 'join-or-create' | 'creation' | 'map';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | null>(
    null,
  );

  if (currentScreen === 'map') {
    return <MapScreen onBack={() => setCurrentScreen('home')} />;
  }

  if (currentScreen === 'creation' && selectedCategory !== null) {
    return (
      <JoinScreen
        selectedCategory={selectedCategory}
        onBack={() => setCurrentScreen('join-or-create')}
      />
    );
  }

  if (currentScreen === 'join-or-create' && selectedCategory !== null) {
    return (
      <JoinOrCreateScreen
        onBack={() => setCurrentScreen('together')}
        onJoin={() => setCurrentScreen('creation')}
      />
    );
  }

  if (currentScreen === 'together' && selectedCategory !== null) {
    return (
      <TogetherScreen
        category={selectedCategory}
        onBack={() => {
          setSelectedCategory(null);
          setCurrentScreen('home');
        }}
        onYes={() => setCurrentScreen('join-or-create')}
      />
    );
  }

  return (
    <HomeScreen
      onOpenMap={() => setCurrentScreen('map')}
      onSelectCategory={category => {
        setSelectedCategory(category);
        setCurrentScreen('together');
      }}
    />
  );
}
