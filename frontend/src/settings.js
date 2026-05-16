import { Text, View, FlatList } from "react-native"
import styles from './styles';

const LIST = [
  { id: '1', title: 'First' },
  { id: '2', title: 'Second' },
  { id: '3', title: 'Third' },
  { id: '4', title: 'Fourth' },
]

const Item = ({ title }) => (
  <View style={styles.item}>
    <Text>{ title }</Text>
  </View>
)

const SettingsScreen = () => {
  const renderItem = ({ item }) => (
    <Item title={item.title} />
  )

  return (
    <View>
      <FlatList
        data={LIST}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  )
}

export default SettingsScreen;