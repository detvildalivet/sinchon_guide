import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { PlaceCategory } from './HomeScreen.tsx';

type TogetherScreenProps = {
  category: PlaceCategory;
  onBack: () => void;
  onYes: () => void;
};

export default function TogetherScreen({
  category,
  onBack,
  onYes,
}: TogetherScreenProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.8}
      >
        <Image
          source={require('../assets/icons/back.png')}
          style={styles.backIcon}
        />
      </TouchableOpacity>

      <Text style={styles.categoryLabel}>{category}</Text>
      <Text style={styles.title}>다른 사람과 함께하고 싶나요?</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={onYes}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>예</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} activeOpacity={0.85}>
          <Text style={styles.buttonText}>아니오</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backIcon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
    tintColor: '#3B82F6',
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    backgroundColor: '#FFFFFF',
    width: '50%',
    alignSelf: 'center',
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
});
