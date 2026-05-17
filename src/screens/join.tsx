import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { PlaceCategory } from './HomeScreen.tsx';

type Meeting = {
  id: string;
  title: string;
  category: PlaceCategory;
  location: string;
  hostName: string;
  participantCount: number;
  maxParticipants: number;
};

type JoinScreenProps = {
  selectedCategory: PlaceCategory;
  onBack: () => void;
};

const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: '연세커피 같이 가실 분',
    category: '카페',
    location: '연세커피',
    hostName: '민지',
    participantCount: 2,
    maxParticipants: 4,
  },
  {
    id: '2',
    title: '신촌 돈까스 저녁팟',
    category: '음식점',
    location: '카츠업',
    hostName: '준호',
    participantCount: 3,
    maxParticipants: 4,
  },
  {
    id: '3',
    title: '가볍게 한잔 하실 분',
    category: '술집',
    location: '합정 포차거리',
    hostName: '서연',
    participantCount: 1,
    maxParticipants: 5,
  },
  {
    id: '4',
    title: '디저트 카페 투어',
    category: '카페',
    location: '망원 루프',
    hostName: '지우',
    participantCount: 2,
    maxParticipants: 3,
  },
];

export default function JoinScreen({
  selectedCategory,
  onBack,
}: JoinScreenProps) {
  const meetings = mockMeetings.filter(
    meeting => meeting.category === selectedCategory,
  );

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

      <Text style={styles.eyebrow}>{selectedCategory}</Text>
      <Text style={styles.title}>참여 가능한 모임</Text>
      <Text style={styles.subtitle}>이미 열려 있는 모임에 바로 합류할 수 있어요.</Text>

      <FlatList
        data={meetings}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.9}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{item.category}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>장소</Text>
              <Text style={styles.metaValue}>{item.location}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>주최자</Text>
              <Text style={styles.metaValue}>{item.hostName}</Text>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.countText}>
                {item.participantCount} / {item.maxParticipants}명 참여중
              </Text>
              <Text style={styles.joinHint}>참여하기</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>아직 열린 모임이 없어요</Text>
            <Text style={styles.emptyDescription}>
              다른 카테고리를 보거나 직접 모임을 만들 수 있습니다.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: 124,
    paddingHorizontal: 20,
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
    marginLeft: -2,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    marginBottom: 24,
  },
  listContent: {
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 26,
  },
  categoryPill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  metaValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right',
  },
  footerRow: {
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  joinHint: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
  },
});
