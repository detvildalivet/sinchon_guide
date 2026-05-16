import { useState } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import MapView from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Config from "react-native-config";

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
      <MapView
        style={styles.map}
        initialRegion={selectedLocation}
        onRegionChangeComplete={ (region) => setSelectedLocation(region) }
      />
      <GooglePlacesAutocomplete
      minLength={2}
        keyboardShouldPersistTaps="handled"
        fetchDetails={true}
        placeholder="Search"
        styles={searchBarStyles}
        query={{
          key: Config.places_api_key,
          language: 'en',
          components: 'country:kr'
        }}
        onPress={(data, details = null) => {
          console.log(data, details)
        }}
        onFail={(error) => console.error(error)}
        onNotFound={() => console.log("No results")}
        keepResultsAfterBlur={true}
      />
    </View>
  )
}

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
})

const searchBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '7%',
    width: '70%',
    alignSelf: 'center',
    zIndex: 1,
  },
  textInput: {
    height: 40,
    width: '70%',
    backgroundColor: 'white',
    borderRadius: 8,
    borderColor: 'orange',
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 14,
    elevation: 5,
  },
  listView: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 5, 
    elevation: 5,
  },
})