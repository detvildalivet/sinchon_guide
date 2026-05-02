import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/home';
import WillYouMatchScreen from './src/willyoumatch';
import ProfileScreen from './src/profile';
import SettingsScreen from './src/settings';
import NoMatchScreen from './src/nomatch';
import MatchingScreen from './src/matching';
import MapScreen from './src/map';

const Stack = createNativeStackNavigator();

function RootStack() {
  return (
    <Stack.Navigator initialRouteName='Home'>
      <Stack.Screen name='Home' component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name='WillYouMatch' component={WillYouMatchScreen} 
        options={{ 
          headerTransparent: true,
          headerTitle: 'Go Back',
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
      <Stack.Screen name='NoMatch' component={NoMatchScreen} 
        options={{ 
          headerTransparent: true,
          headerTitle: 'Go Back',
          headerShadowVisible: false
        }}
      />
      <Stack.Screen name='Matching' component={MatchingScreen}
        options={{
          headerTitle: 'Matching...',
          headerTitleAlign: 'center'
        }}
      />
      <Stack.Screen name='Map' component={MapScreen}
        options={{
          headerTransparent: true,
          headerTitle: 'Go Back',
          headerShadowVisible: false
        }}
      />
    </Stack.Navigator>
  );
}

const App = () => {
  return (
    <NavigationContainer>
      <RootStack/>
    </NavigationContainer>
  );
}

export default App;