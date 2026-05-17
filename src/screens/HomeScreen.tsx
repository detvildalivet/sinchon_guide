import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';

export type PlaceCategory = '음식점' | '카페' | '술집';
export type MockUser = {
  id: string;
  loginId: string;
  name: string;
};

type HomeScreenProps = {
  currentUser: MockUser | null;
  onLogin: (user: MockUser) => void;
  onLogout: () => void;
  onOpenMap: () => void;
  onSelectCategory: (category: PlaceCategory) => void;
};

export default function HomeScreen({
  currentUser,
  onLogin,
  onLogout,
  onOpenMap,
  onSelectCategory,
}: HomeScreenProps) {
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    const trimmedId = userId.trim();
    const trimmedPassword = password.trim();

    if (trimmedId.length === 0 || trimmedPassword.length === 0) {
      return;
    }

    onLogin({
      id: 'mock-user-1',
      loginId: trimmedId,
      name: trimmedId,
    });

    setIsProfileModalVisible(false);
    setUserId('');
    setPassword('');
  };

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

        <TouchableOpacity
          style={styles.mapButton}
          onPress={onOpenMap}
          activeOpacity={0.8}
        >
          <Image
            source={require('../assets/icons/map.png')}
            style={styles.mapIcon}
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
            {currentUser === null ? (
              <>
                <Text style={styles.modalTitle}>로그인</Text>
                <Text style={styles.modalDescription}>
                  YGS 계정으로 로그인해요
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>아이디</Text>
                  <TextInput
                    value={userId}
                    onChangeText={setUserId}
                    placeholder="아이디를 입력하세요"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>비밀번호</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="비밀번호를 입력하세요"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={styles.modalSecondaryButton}
                    onPress={() => setIsProfileModalVisible(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalSecondaryText}>닫기</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={handleLogin}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalActionText}>로그인</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.signUpButton}
                  activeOpacity={0.85}
                >
                  <Text style={styles.signUpText}>회원가입</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>내 프로필</Text>
                <Text style={styles.modalDescription}>
                  목업 로그인 상태로 표시되는 프로필 정보예요
                </Text>

                <View style={styles.profileInfoBlock}>
                  <Text style={styles.profileLabel}>이름</Text>
                  <Text style={styles.profileValue}>{currentUser.name}</Text>
                </View>

                <View style={styles.profileInfoBlock}>
                  <Text style={styles.profileLabel}>로그인 ID</Text>
                  <Text style={styles.profileValue}>{currentUser.loginId}</Text>
                </View>

                <View style={styles.profileInfoBlock}>
                  <Text style={styles.profileLabel}>사용자 ID</Text>
                  <Text style={styles.profileValue}>{currentUser.id}</Text>
                </View>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={styles.modalSecondaryButton}
                    onPress={() => setIsProfileModalVisible(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalSecondaryText}>닫기</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={() => {
                      onLogout();
                      setIsProfileModalVisible(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalActionText}>로그아웃</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    width: 32,
    height: 32,
    tintColor: '#2563EB',
  },
  mapButton: {
    position: 'absolute',
    top: 60,
    right: 24,
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
  mapIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    tintColor: '#2563EB',
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
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalSecondaryButton: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#E5E7EB',
  },
  modalSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  modalActionButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signUpButton: {
    marginTop: 14,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  profileInfoBlock: {
    marginBottom: 16,
  },
  profileLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  profileValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
});
