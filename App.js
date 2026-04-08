import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/home';
import WillYouMatchScreen from './src/willyoumatch'

const Stack = createNativeStackNavigator();

function RootStack() {
  return (
    <Stack.Navigator initialRouteName='Home'>
      <Stack.Screen name='Home' component={HomeScreen} />
      <Stack.Screen name='WillYouMatch' component={WillYouMatchScreen} />
    </Stack.Navigator>
  );
}

class App extends Component {
  render () {
    return (
      <NavigationContainer>
        <RootStack/>
      </NavigationContainer>
    );
  }
}

export default App;