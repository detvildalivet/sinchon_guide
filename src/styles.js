import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    margin: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
  },
  topRightContainer: {
    position: 'absolute',
    top: 60,
    right: 30,
    flexDirection: 'row',
    gap: 20,
  },
  topLeftContainer: {
    position: 'absolute',
    top: 60,
    left: 30,
    flexDirection: 'row',
    gap: 20,
  },
  bottomRightContainer: {
    position: 'absolute',
    bottom: 60,
    right: 30,
    flexDirection: 'row',
    gap: 20,
  },
  bottomLeftContainer: {
    position: 'absolute',
    bottom: 60,
    left: 30,
    flexDirection: 'row',
    gap: 20,
  },
  topContainer: {
    flex: 1,
    flexDirection: 'row',
    position: 'absolute',
    justifyContent: 'center',
    top: 200,
    gap: 20,
  },
  maintxt: {
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 40,
  },
  subTitle: {
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 32,
    margin: 5,
  },
  item: {
    backgroundColor: 'white',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
  },
  icon: {
    width: 40,
    height: 40
  },
  smallIcon: {
    width: 30,
    height: 30,
  },
  textWithIcon: {
    fontSize: 20,
    marginLeft: 20,
  },
  topBlock: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    backgroundColor: 'orange',
  },
  profileContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  settingsIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  minimap: {
    width: 200,
    height: 200,
    resizeMode: 'center'
  },
});

export default styles;