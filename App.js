import React from 'react';
import {Button, StyleSheet, Text, View, Alert} from 'react-native';

function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.maintxt}>
        Where do you want to go now?
      </Text>
      <View style={styles.buttonContainer}>
        <Button title="Restaurant" onPress={()=>Alert.alert("Your Choice: ", "Resaturant")}/>
        <Button title="Bar" onPress={()=>Alert.alert("Your Choice: ", "Bar")}/>
        <Button title="Cafe" onPress={()=>Alert.alert("Your Choice: ", "Cafe")}/>        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maintxt: {
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 40,
  },
  buttonContainer: {
    margin: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20
  }
});

export default App;