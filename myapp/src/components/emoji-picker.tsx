import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Border, NB, Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const EMOJIS = [
  '💧', '🏋️', '📚', '🏃', '🧘', '😴', '🥗', '💊',
  '🧠', '✍️', '🎨', '🎵', '🌿', '☕', '🚶', '🚴',
  '🤸', '🛁', '🙏', '📝', '🌅', '🌙', '🍎', '🥛',
  '🏊', '🎯', '🧹', '💼', '🌱', '🤝',
];

type Props = {
  selected: string;
  onSelect: (emoji: string) => void;
};

export function EmojiPicker({ selected, onSelect }: Props) {
  const theme = useTheme();

  return (
    <View>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        ICON
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {EMOJIS.map((emoji) => {
          const isSelected = emoji === selected;
          return (
            <TouchableOpacity
              key={emoji}
              onPress={() => onSelect(emoji)}
              style={[
                styles.item,
                {
                  backgroundColor: isSelected ? NB.yellow : theme.card,
                  borderColor: isSelected ? NB.black : theme.border,
                  ...(isSelected ? Shadow.small : {}),
                  shadowColor: NB.black,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  scroll: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  item: {
    width: 52,
    height: 52,
    borderRadius: Border.radiusSm,
    borderWidth: Border.width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
});
