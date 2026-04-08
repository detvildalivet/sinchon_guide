import React, { Component } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

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
          <Button title='Yes'/>
          <Button title='No'/>        
        </View>
      </View>
    );
  }
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

export default WillYouMatchScreen;