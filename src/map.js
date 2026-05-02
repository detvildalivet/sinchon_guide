import { useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView from "react-native-maps";
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;

const latDelta = 0.04;
const lngDelta = latDelta * ASPECT_RATIO;

const MapScreen = () => {
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 37.5550,
    longitude: 126.9365,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta
  })

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={selectedLocation}
        onRegionChangeComplete={(region)=>setSelectedLocation(region)}
      />
    </View>
  )
}

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  }
})