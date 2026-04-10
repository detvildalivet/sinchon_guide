import { Component } from 'react';
import { Button, Text, View, Alert } from 'react-native'; // Alert is only for testing.
import styles from './styles';

class WillYouMatchScreen extends Component {
  render () {
    const { params } = this.props.route;
    const selectedPlace = params ? params.selectedPlace : null;
    return (
      <View style={styles.container}>
        <Text style={styles.maintxt}>
          Do you want to go { selectedPlace } with people?
        </Text>
        <View style={styles.buttonContainer}>
          <Button title='Yes' onPress={()=>Alert.alert('Your Choice: ', `You go to ${ selectedPlace } with people.`)}/>
          <Button title='No' onPress={()=>Alert.alert('Your choice: ', `You go to ${ selectedPlace } alone.`)}/>        
        </View>
      </View>
    )
  }
}

export default WillYouMatchScreen;