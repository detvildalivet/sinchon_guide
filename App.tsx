import { useState } from 'react';

import HomeScreen, { type PlaceCategory } from './src/screens/HomeScreen.tsx';
import JoinOrCreateScreen from './src/screens/JoinOrCreate.tsx';
import TogetherScreen from './src/screens/Together.tsx';

type Screen = 'home' | 'together' | 'join-or-create';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | null>(
    null,
  );

  if (currentScreen === 'join-or-create' && selectedCategory !== null) {
    return <JoinOrCreateScreen onBack={() => setCurrentScreen('together')} />;
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
      onSelectCategory={category => {
        setSelectedCategory(category);
        setCurrentScreen('together');
      }}
    />
  );
}
