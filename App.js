import { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/home';
import WillYouMatchScreen from './src/willyoumatch';
import ProfileScreen from './src/profile';
import SettingsScreen from './src/settings';

const Stack = createNativeStackNavigator();

function RootStack() {
  return (
    <Stack.Navigator initialRouteName='Home'>
      <Stack.Screen name='Home' component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name='WillYouMatch' component={WillYouMatchScreen} 
        options={{ 
          headerTransparent: true,
          headerTitle: 'Go back',
          headerShadowVisible: false
        }} 
      />
      <Stack.Screen name='Profile' component={ProfileScreen} 
        options={{
          headerTitle: 'Profile',
          headerTitleAlign: 'center'
        }}
      />
      <Stack.Screen name='Settings' component={SettingsScreen} 
        options={{
          headerTitle: 'Settings',
          headerTitleAlign: 'center'
        }}
      />
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