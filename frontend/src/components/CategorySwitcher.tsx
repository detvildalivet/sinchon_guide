import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../design/theme';
import { VenueCategory } from '../types/sinchonGuide';

const categories: Array<{ id: VenueCategory; label: string }> = [
  { id: 'restaurant', label: '음식점' },
  { id: 'cafe', label: '카페' },
  { id: 'bar', label: '술집' },
];

type Props = {
  category: VenueCategory;
  onCategoryChange: (category: VenueCategory) => void;
  style?: StyleProp<ViewStyle>;
};

export function CategorySwitcher({
  category,
  onCategoryChange,
  style,
}: Props) {
  return (
    <View style={[styles.categoryBar, style]}>
      {categories.map(item => {
        const active = item.id === category;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onCategoryChange(item.id)}
            style={({ pressed }) => [
              styles.categoryItem,
              active && styles.activeCategoryItem,
              pressed && styles.pressed,
            ]}>
            <Text
              style={[
                styles.categoryText,
                active && styles.activeCategoryText,
              ]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  categoryBar: {
    minHeight: 46,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    padding: 4,
  },
  categoryItem: {
    flex: 1,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCategoryItem: {
    backgroundColor: theme.colors.primary,
    ...theme.shadow.soft,
  },
  categoryText: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  activeCategoryText: {
    color: theme.colors.textOnPrimary,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
