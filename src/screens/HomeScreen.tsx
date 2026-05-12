import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Pressable,
} from 'react-native';

export type PlaceCategory = '음식점' | '카페' | '술집';

type HomeScreenProps = {
  onSelectCategory: (category: PlaceCategory) => void;
};

export default function HomeScreen({ onSelectCategory }: HomeScreenProps) {
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => setIsProfileModalVisible(true)}
          activeOpacity={0.8}
        >
          <Image
            source={require('../assets/icons/profile.png')}
            style={styles.profileIcon}
          />
        </TouchableOpacity>

        <Text style={styles.title}>어디로 가고싶나요?</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => onSelectCategory('음식점')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>음식점</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => onSelectCategory('카페')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>카페</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => onSelectCategory('술집')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>술집</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={isProfileModalVisible}
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsProfileModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>프로필</Text>
            <Text style={styles.modalDescription}>
              여기에 프로필, 설정, 로그아웃 같은 메뉴를 넣을 수 있습니다.
            </Text>

            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => setIsProfileModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalActionText}>닫기</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileIcon: {
    width: 40,
    height: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 30,
    color: '#222',
    textAlign: 'center',
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

    // 카드 느낌
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
    marginBottom: 24,
  },
  modalActionButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#222222',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
