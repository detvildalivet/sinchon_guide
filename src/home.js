import { Component } from 'react';
import { TouchableOpacity, Button, Text, View, Alert, Image } from 'react-native'; // Alert is only for testing.
import styles from './styles';

class HomeScreen extends Component {
  render () {
    return (
      <View style={styles.container}>
        <Text style={styles.maintxt}>
          Where do you want to go now?
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            title="Restaurant"
            onPress={()=>
              { this.props.navigation.navigate('WillYouMatch', { selectedPlace: 'Restaurant' }) }
            }
          />
          <Button
            title="Cafe"
            onPress={()=>
              { this.props.navigation.navigate('WillYouMatch', { selectedPlace: 'Cafe' }) }
            }
          />
          <Button
            title="Bar"
            onPress={()=>
              { this.props.navigation.navigate('WillYouMatch', { selectedPlace: 'Bar' }) }
            }
          />       
        </View>
        <View style={styles.topRightContainer}>
          <TouchableOpacity onPress={()=>Alert.alert('MAPPP')}>
            <Image
              style={styles.icon}
              source={require('./assets/pics/maps-and-flags.png')}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.topLeftContainer}>
          <TouchableOpacity
            onPress={()=>
              { this.props.navigation.navigate('Profile') }
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
}

export default HomeScreen;