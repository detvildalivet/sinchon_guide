import { Button, Text, View, Alert } from 'react-native'; // Alert is only for testing.
import styles from './styles';

const WillYouMatchScreen = ({ route, navigation }) => {
  const selectedPlace = route?.params?.selectedPlace || null;
  return (
    <View style={styles.container}>
      <Text style={styles.maintxt}>
        Do you want to go { selectedPlace } with people?
      </Text>
      <View style={styles.buttonContainer}>
        <Button 
          title='Yes' 
          onPress={()=>
            { navigation.navigate('Matching', { selectedPlace: selectedPlace }) }
          }
          color='orange'
        />
        <Button 
          title='No' 
          onPress={()=>
            { navigation.navigate('NoMatch', { selectedPlace: selectedPlace}) }
          }
          color='orange'
        />        
      </View>
    </View>
  )
}


export default WillYouMatchScreen;