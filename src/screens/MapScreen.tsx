import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

type MapScreenProps = {
  onBack: () => void;
};

const initialRegion = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

const meetingMarkers = [
  {
    id: '1',
    title: '연세커피 같이 가실 분',
    description: '연세커피',
    latitude: 37.5659,
    longitude: 126.9387,
  },
  {
    id: '2',
    title: '신촌 돈까스 저녁팟',
    description: '카츠업',
    latitude: 37.5565,
    longitude: 126.9368,
  },
  {
    id: '3',
    title: '가볍게 한잔 하실 분',
    description: '합정 포차거리',
    latitude: 37.5496,
    longitude: 126.9137,
  },
];

export default function MapScreen({ onBack }: MapScreenProps) {
  const [mapReady, setMapReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
        onMapLoaded={() => setMapLoaded(true)}
      >
        {meetingMarkers.map(marker => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
          />
        ))}
      </MapView>

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

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>지도에서 모임 보기</Text>
        <Text style={styles.headerSubtitle}>
          현재는 목업 마커를 표시하고 있습니다.
        </Text>
        <View style={styles.debugRow}>
          <Text style={styles.debugText}>
            ready: {mapReady ? 'yes' : 'no'} / loaded: {mapLoaded ? 'yes' : 'no'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFill,
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
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  backIcon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
    tintColor: '#2563EB',
  },
  headerCard: {
    position: 'absolute',
    top: 124,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  debugRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  debugText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
});
