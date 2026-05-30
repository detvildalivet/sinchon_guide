import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const layoutStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
