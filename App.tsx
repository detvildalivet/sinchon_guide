import React from 'react';
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const CATEGORIES = ['식당', '카페', '술집'];

function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBar}>
        <Pressable style={styles.topButton}>
          <Text style={styles.topButtonText}>프로필</Text>
        </Pressable>
        <Pressable style={styles.topButton}>
          <Text style={styles.topButtonText}>지도</Text>
        </Pressable>
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.headline}>지금 무엇을 하고 싶나요?</Text>

        <View style={styles.categoryRow}>
          {CATEGORIES.map(category => (
            <Pressable key={category} style={styles.categoryButton}>
              <Text style={styles.categoryText}>{category}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable style={styles.settingsButton}>
        <Text style={styles.settingsButtonText}>설정</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f5f0',
    paddingHorizontal: 20,
  },
  topBar: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8dfd6',
  },
  topButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2a22',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
  headline: {
    fontSize: 27,
    fontWeight: '700',
    color: '#152019',
    textAlign: 'center',
  },
  categoryRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  categoryButton: {
    minWidth: 86,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#1e6a4e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsButton: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: '#11281c',
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default App;
