import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const shellStyles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  promptPanel: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    zIndex: 11,
    ...theme.shadow.soft,
    elevation: 8,
  },
  promptBox: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    ...theme.shadow.soft,
  },
  bottomPanel: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 12,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
    ...theme.shadow.floating,
    elevation: 10,
  },
  panelKicker: {
    fontSize: theme.typography.caption,
    fontWeight: '900',
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  panelTitle: {
    fontSize: theme.typography.title,
    lineHeight: 36,
    fontWeight: '900',
    flexShrink: 1,
  },
  panelDescription: {
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  chip: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
