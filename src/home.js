import { TouchableOpacity, Button, Text, View, Alert, Image } from 'react-native'; // Alert is only for testing.
import styles from './styles';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.maintxt}>
        Where do you want to go now?
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Restaurant"
          onPress={()=>
            { navigation.navigate('WillYouMatch', { selectedPlace: 'Restaurant' }) }
          }
        />
        <Button
          title="Cafe"
          onPress={()=>
            { navigation.navigate('WillYouMatch', { selectedPlace: 'Cafe' }) }
          }
        />
        <Button
          title="Bar"
          onPress={()=>
            { navigation.navigate('WillYouMatch', { selectedPlace: 'Bar' }) }
          }
        />       
      </View>
      <View style={styles.topRightContainer}>
        <TouchableOpacity onPress={()=>
          { navigation.navigate('Map') }
        }>
          <Image
            style={styles.icon}
            source={require('./assets/pics/maps-and-flags.png')}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.topLeftContainer}>
        <TouchableOpacity
          onPress={()=>
            { navigation.navigate('Profile') }
          }
        >
          <Image
            style={styles.icon}
            source={require('./assets/pics/user.png')}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
} 

export default HomeScreen;