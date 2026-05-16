import { View, Text, FlatList, Image, StyleSheet } from 'react-native';

const ICON_by_TYPES = {
  default: require('./assets/pics/default.png'),
  restaurant: require('./assets/pics/restaurant.png'),
  cafe: require('./assets/pics/cafe.png'),
  alcohol: require('./assets/pics/alcohol.png')
}

const DATA = [
  {id: 1, name: 'Cocaine Coffee', location: '29, Damnexam-ro, Sinchon-dong, Seoul', type: 'cafe', currentPeople: 3},
  {id: 2, name: 'Really Good Pasta', location: '7, Insomnia-ro, Sinchon-dong, Seoul', type: 'restaurant', currentPeople: 5},
]

const Item = ({name, location, type, currentPeople}) => {
  const iconSource = ICON_by_TYPES[type] || ICON_by_TYPES[ICON_by_TYPES.default]

  return (
    <View style={styles.card}>
      <Image source={iconSource} style={styles.typeIcon} />
      
      <View style={styles.textContainer}>
        <Text style={styles.nameText}>{name}</Text>
        <Text style={styles.locationText}>{location}</Text>
      </View>
      
      <View style={styles.peopleContainer}>
        <Image source={require('./assets/pics/matching_man.png')} style={styles.peopleIcon} />
        <Text style={styles.peopleText}>{currentPeople}</Text>
      </View>
    </View>
  )
}

const MatchingScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={DATA}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Item 
            name={item.name} 
            location={item.location} 
            type={item.type} 
            currentPeople={item.currentPeople} 
          />
        )}
      />
    </View>
  );
};

export default MatchingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: 'orange',
    borderRadius: 15,
    backgroundColor: '#fff',
  },
  typeIcon: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  locationText: {
    fontSize: 12,
    marginRight: 5
  },
  peopleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  peopleIcon: {
    width: 30,
    height: 30,
    marginRight: 5,
    resizeMode: 'contain',
  },
  peopleText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
})