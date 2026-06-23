import React, { useEffect } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { Border, NB, Shadow, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  Habit,
  frequencySummary,
  habitIsActiveToday,
  today,
  Frequency,
} from '@/lib/habits/types';
import { ThreeDIcon, IconType } from './three-d-icon';

type Props = {
  habit: Habit;
  onPress: () => void;
  onMarkDone: () => void;
};

// Map emojis to premium vector icons when possible
function getIconNameOrEmoji(emoji: string): IconType {
  switch (emoji) {
    case '💧': return 'water';
    case '🏋️': return 'workout';
    case '📚': return 'read';
    case '☕': return 'coffee';
    case '🎯': return 'focus';
    case '🌙': return 'sleep';
    default: return emoji as IconType; // passed as fallback raw text
  }
}

function formatCardSubtitle(freq: Frequency): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const ampm = freq.hour >= 12 ? 'PM' : 'AM';
  const displayHour = freq.hour % 12 === 0 ? 12 : freq.hour % 12;
  const time = `${displayHour}:${pad(freq.minute)} ${ampm}`;
  if (freq.kind === 'daily') {
    return `Every day • ${time}`;
  }
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = freq.weekdays.map((d) => DAYS[d]).join(', ');
  return `${days} • ${time}`;
}

export function HabitCard({ habit, onPress, onMarkDone }: Props) {
  const theme = useTheme();
  const isDoneToday = habit.lastCompletedISO === today();
  const isActiveToday = habitIsActiveToday(habit);

  // Animation values for checkmark bounce
  const checkedScale = useSharedValue(isDoneToday ? 1 : 0);

  useEffect(() => {
    checkedScale.value = withSpring(isDoneToday ? 1 : 0, {
      damping: 12,
      stiffness: 180,
    });
  }, [isDoneToday, checkedScale]);

  const animatedCheckStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: checkedScale.value }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDoneToday ? '#EDFDF4' : theme.card, // soft success green background if completed
          borderColor: NB.black,
          borderWidth: Border.width,
          ...Shadow.medium,
          shadowColor: NB.black,
          transform: [
            { translateX: pressed ? 3 : 0 },
            { translateY: pressed ? 3 : 0 },
          ],
        },
      ]}
    >
      <View style={styles.left}>
        {/* Three-D Icon Pack usage */}
        <ThreeDIcon
          name={getIconNameOrEmoji(habit.emoji)}
          size={30}
          shadowDepth={2.5}
        />

        <View style={styles.info}>
          <Text
            style={[
              styles.name,
              {
                color: isDoneToday ? '#1E8F4E' : theme.text,
                textDecorationLine: isDoneToday ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}
          >
            {habit.name}
          </Text>

          <Text
            style={[
              styles.frequency,
              { color: isDoneToday ? '#1E8F4E' : theme.textSecondary },
            ]}
            numberOfLines={1}
          >
            {formatCardSubtitle(habit.frequency)}
          </Text>

          <View style={styles.metaRow}>
            {/* Streak count pill */}
            <View style={[styles.metaPill, { borderColor: NB.black, backgroundColor: NB.yellow }]}>
              <Text style={styles.metaText}>
                🔥 {habit.streak} {habit.streak === 1 ? 'Day' : 'Day'} Streak
              </Text>
            </View>
            {!isActiveToday && (
              <View style={[styles.metaPill, { borderColor: NB.black, backgroundColor: NB.coral }]}>
                <Text style={styles.metaText}>Not today</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Interactive 3D Checkbox */}
      <Pressable
        onPress={(event: GestureResponderEvent) => {
          event.stopPropagation();
          if (!isDoneToday && isActiveToday) {
            onMarkDone();
          }
        }}
        disabled={isDoneToday || !isActiveToday}
        style={({ pressed }) => [
          styles.doneBtn,
          {
            backgroundColor: isDoneToday ? NB.green : pressed ? NB.yellowDark : NB.yellow,
            borderColor: NB.black,
            borderWidth: Border.width,
            opacity: !isActiveToday && !isDoneToday ? 0.45 : 1,
            transform: [
              { translateY: pressed && !isDoneToday ? 2 : 0 },
              { translateX: pressed && !isDoneToday ? 2 : 0 },
            ],
          },
        ]}
      >
        {isDoneToday ? (
          <Animated.View style={[styles.checkContainer, animatedCheckStyle]}>
            <Text style={styles.checkMarkText}>✓</Text>
          </Animated.View>
        ) : (
          <Text style={styles.doneBtnText}>Done</Text>
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Border.radiusLg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...Typography.cardTitle,
  },
  frequency: {
    ...Typography.body,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  metaPill: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  metaText: {
    ...Typography.caption,
    color: NB.black,
  },
  doneBtn: {
    width: 64,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    ...Typography.button,
    color: NB.black,
  },
  checkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
  },
});
