import React, { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from './Icon';
import { theme } from '../design/theme';

type Props = PropsWithChildren<{
  icon: IconName;
  title: string;
  description: string;
}>;

// Shared shape for empty/error states — previously each screen just showed a
// bare line of muted text. Used for AskScreen's empty/error result and
// HistoryScreen's empty/error history.
export function EmptyState({ icon, title, description, children }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={22} color={theme.colors.muted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.text.heading,
    color: theme.colors.text,
    textAlign: 'center',
  },
  description: {
    ...theme.text.body,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  actions: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
    alignSelf: 'stretch',
  },
});
