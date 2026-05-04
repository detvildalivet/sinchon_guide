import { useState } from "react";
import { TextInput } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import { Dimensions } from 'react-native';
import MapView from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

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
  });

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        style={styles.searchBar}
        placeholder="Search"
      />
      <MapView
        style={styles.map}
        region={selectedLocation}
        onRegionChangeComplete={ (region) => setSelectedLocation(region) }
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
  },
  searchBar: {
    position: 'absolute',
    top: '7%',
    width: '70%',
    alignSelf: 'center',
    height: 40,
    backgroundColor: 'white',
    borderRadius: 8,
    borderColor: 'orange',
    borderWidth: 1,
    paddingHorizontal: 15,
    zIndex: 1,
    fontSize: 14,
  }
})