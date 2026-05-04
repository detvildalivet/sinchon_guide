import React, { useState } from 'react';
import { Button, Text, View, Alert, Image } from 'react-native'; // Alert is only for testing.
import styles from './styles';

const NoMatchScreen = ({ route }) => {
  const [index, setIndex] = useState(0)

  const pressedNo = () => {
    setIndex((prev) => (prev + 1) % location.length)
  }

  const location = [
    {
      id: '0',
      title: 'NIS',
      source: require('./assets/minimaps/Map_temp.png')
    },
    {
      id: '1',
      title: 'The Pentagon',
      source: require('./assets/minimaps/Map2_temp.png')
    }
  ]
  const selectedPlace = route?.params?.selectedPlace || null
  
  return (
    <View style={styles.container}>
      
      <View style={styles.topContainer}>
        <Text style={styles.maintxt}>
          Do you like this place?
        </Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <Image source={location[index].source} style={styles.minimap} />
        <Text style={styles.subTitle}>{ location[index].title }</Text>
        
        <View style={[styles.buttonContainer, { margin: 10 }]}>
          <Button 
            title='Yes' 
            onPress={()=>
              Alert.alert('Your choose to go to: ', `${location[index].title}`)
            }
            color='orange'
          />
          <Button 
            title='No' 
            onPress={pressedNo} 
            color='orange'
          />
        </View>
      </View>

    </View>
  )
}

export default NoMatchScreen;