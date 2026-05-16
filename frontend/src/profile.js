import { Text, View, FlatList, Image, TouchableOpacity } from "react-native"
import styles from './styles';

const LIST = [
  { 
    id: '0',
    title: 'History',
    iconSource: require('./assets/pics/history.png'),
  },
]

const Item = ({ title, iconSource }) => (
  <View style={styles.item}>
    <Image source={iconSource} style={styles.smallIcon} />
    <Text style={styles.textWithIcon}>{ title }</Text>
  </View>
)

const ProfileScreen = ({ navigation }) => {
  const renderItem = ({ item }) => (
      <Item title={item.title} iconSource={item.iconSource} />
  )

  const USERDATA = {
    username: 'Adam',
    imgSource: require('./assets/pics/user.png')
  }

  return (
    <View style={{flex: 1}}>
      <View style={styles.topBlock}>
        <View style={styles.profileContainer}>
          <Image style={{width: 60, height: 60}} source={USERDATA.imgSource} />
        </View>
        <View style={styles.settingsIconContainer}>
          <TouchableOpacity onPress={()=>navigation.navigate('Settings')}>
            <Image style={styles.smallIcon} source={require('./assets/pics/setting.png')} />
          </TouchableOpacity>
        </View>
        <Text style={styles.usernameText}>{USERDATA.username}</Text>
      </View>
      <View style={{flex: 1}}>
        <FlatList
          data={LIST}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      </View>
    </View>
  )
}

export default ProfileScreen;