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
        <Button title='Yes' onPress={()=>Alert.alert('Your Choice: ', `You go to ${ selectedPlace } with people.`)}/>
        <Button title='No' onPress={()=>navigation.navigate('NoMatch', { selectedPlace: selectedPlace})}/>        
      </View>
    </View>
  )
}


export default WillYouMatchScreen;