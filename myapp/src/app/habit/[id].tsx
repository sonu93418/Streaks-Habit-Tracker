import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Border, NB, Shadow, Spacing, Typography } from '@/constants/theme';
import { useHabits } from '@/hooks/useHabits';
import { useTheme } from '@/hooks/useTheme';
import { frequencySummary, today, yesterday } from '@/lib/habits/types';

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100];

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getNextMilestone(streak: number): number | null {
  return STREAK_MILESTONES.find((milestone) => milestone > streak) ?? null;
}

export default function HabitDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = getParam(params.id);
  const router = useRouter();
  const theme = useTheme();
  const { habits, isLoading, removeHabit, markDone } = useHabits();

  const habit = useMemo(
    () => (id ? habits.find((item) => item.id === id) ?? null : null),
    [id, habits]
  );

  const handleDelete = () => {
    if (!habit) return;
    Alert.alert(
      'Delete Habit',
      `Delete "${habit.name}" and cancel its reminders?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeHabit(habit.id);
              router.replace('/(tabs)/' as any);
            } catch (error) {
              console.warn('[habit] Failed to delete habit:', error);
              Alert.alert('Could not delete habit', 'Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading && habit === null) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.loadingEmoji}>⏳</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.safe}>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/' as any)}
            style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.backBtnText, { color: theme.text }]}>← Home</Text>
          </TouchableOpacity>

          <View style={styles.center}>
            <Text style={styles.loadingEmoji}>🔍</Text>
            <Text style={[styles.notFoundTitle, { color: theme.text }]}>
              Habit not found
            </Text>
            <Text style={[styles.notFoundBody, { color: theme.textSecondary }]}>
              This link is invalid or the habit was deleted.
            </Text>
            <TouchableOpacity
              style={[
                styles.goHomeBtn,
                {
                  backgroundColor: NB.yellow,
                  borderColor: NB.black,
                  ...Shadow.medium,
                  shadowColor: NB.black,
                },
              ]}
              onPress={() => router.replace('/(tabs)/' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.goHomeBtnText}>Go Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isDoneToday = habit.lastCompletedISO === today();
  const nextMilestone = getNextMilestone(habit.streak);
  const prevMilestone = STREAK_MILESTONES.filter((milestone) => milestone <= habit.streak).pop() ?? 0;
  const progressToNext = nextMilestone
    ? (habit.streak - prevMilestone) / (nextMilestone - prevMilestone)
    : 1;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.backBtnText, { color: theme.text }]}>← Back</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: isDoneToday ? NB.green : (habit.color || NB.yellow),
                borderColor: NB.black,
                ...Shadow.large,
                shadowColor: NB.black,
              },
            ]}
          >
            <Text style={styles.heroEmoji}>{habit.emoji}</Text>
            <Text style={styles.heroName}>{habit.name}</Text>
            <Text style={styles.heroFreq}>{frequencySummary(habit.frequency)}</Text>
            {isDoneToday && (
              <View style={styles.doneBadge}>
                <Text style={styles.doneBadgeText}>Done today</Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                ...Shadow.medium,
                shadowColor: theme.shadow,
              },
            ]}
          >
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
              CURRENT STREAK
            </Text>
            <View style={styles.streakRow}>
              <Text style={styles.streakIcon}>{habit.streak >= 3 ? '🔥' : '✨'}</Text>
              <Text style={[styles.streakNumber, { color: theme.text }]}>
                {habit.streak}
              </Text>
              <Text style={[styles.streakUnit, { color: theme.textSecondary }]}>
                {habit.streak === 1 ? 'day' : 'days'}
              </Text>
            </View>

            {nextMilestone ? (
              <>
                <View style={[styles.milestoneBarBg, { borderColor: theme.border }]}>
                  <View
                    style={[
                      styles.milestoneBarFill,
                      {
                        width: `${Math.max(0, Math.min(1, progressToNext)) * 100}%`,
                        backgroundColor: NB.yellow,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.milestoneText, { color: theme.textSecondary }]}>
                  {nextMilestone - habit.streak} days to your {nextMilestone}-day milestone
                </Text>
              </>
            ) : (
              <Text style={[styles.milestoneText, { color: theme.textSecondary }]}>
                All milestones achieved.
              </Text>
            )}

            {habit.lastCompletedISO && (
              <Text style={[styles.lastCompleted, { color: theme.textSecondary }]}>
                Last completed:{' '}
                {habit.lastCompletedISO === today()
                  ? 'Today'
                  : habit.lastCompletedISO === yesterday()
                    ? 'Yesterday'
                    : habit.lastCompletedISO}
              </Text>
            )}
          </View>

          <TouchableOpacity
            disabled={isDoneToday}
            onPress={() => markDone(habit.id)}
            style={[
              styles.markDoneBtn,
              {
                backgroundColor: isDoneToday ? theme.card : NB.yellow,
                borderColor: theme.border,
                ...Shadow.medium,
                shadowColor: theme.shadow,
                opacity: isDoneToday ? 0.6 : 1,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.markDoneBtnText,
                { color: isDoneToday ? theme.textSecondary : NB.black },
              ]}
            >
              {isDoneToday ? 'Marked as Done' : 'Mark as Done Today'}
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
              REMINDERS
            </Text>
            <Text style={[styles.notifCount, { color: theme.text }]}>
              {habit.notificationIds.length > 0
                ? `${habit.notificationIds.length} scheduled reminder${habit.notificationIds.length === 1 ? '' : 's'}`
                : 'No reminders scheduled. Check notification permission and save again.'}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.editBtn,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  ...Shadow.small,
                  shadowColor: theme.shadow,
                },
              ]}
              onPress={() => router.push(`/(tabs)/add?editId=${habit.id}` as any)}
              activeOpacity={0.8}
            >
              <Text style={[styles.editBtnText, { color: theme.text }]}>Edit Habit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteBtn,
                {
                  backgroundColor: NB.coral,
                  borderColor: NB.black,
                  ...Shadow.small,
                  shadowColor: NB.black,
                },
              ]}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 20 },
  scroll: { paddingBottom: Spacing.six },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  loadingEmoji: { fontSize: 48 },
  notFoundTitle: {
    ...Typography.sectionHeading,
    textAlign: 'center',
  },
  notFoundBody: {
    ...Typography.body,
    textAlign: 'center',
  },
  goHomeBtn: {
    marginTop: 16,
    borderWidth: 2.5,
    borderRadius: Border.radius,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  goHomeBtnText: {
    ...Typography.button,
    color: NB.black,
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 2.5,
    borderRadius: Border.radiusSm,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 8,
    marginBottom: 16,
  },
  backBtnText: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  heroCard: {
    borderWidth: 3,
    borderRadius: Border.radiusLg,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  heroEmoji: { fontSize: 60 },
  heroName: {
    ...Typography.screenTitle,
    color: NB.black,
    textAlign: 'center',
  },
  heroFreq: {
    ...Typography.body,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: NB.black,
    opacity: 0.75,
    textAlign: 'center',
  },
  doneBadge: {
    backgroundColor: NB.black,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  doneBadgeText: {
    color: NB.green,
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  card: {
    borderWidth: 2.5,
    borderRadius: Border.radius,
    padding: 20,
    marginBottom: 12,
    gap: 8,
  },
  cardLabel: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  streakIcon: { fontSize: 36 },
  streakNumber: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 54,
    letterSpacing: -2,
  },
  streakUnit: {
    ...Typography.cardTitle,
  },
  milestoneBarBg: {
    height: 10,
    borderWidth: 2,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4,
  },
  milestoneBarFill: {
    height: '100%',
  },
  milestoneText: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  lastCompleted: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 4,
  },
  notifCount: {
    ...Typography.body,
    fontFamily: 'PlusJakartaSans_700Bold',
    lineHeight: 21,
  },
  markDoneBtn: {
    borderWidth: 2.5,
    borderRadius: Border.radius,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  markDoneBtnText: {
    ...Typography.button,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  editBtn: {
    flex: 1,
    borderWidth: 2.5,
    borderRadius: Border.radius,
    paddingVertical: 15,
    alignItems: 'center',
  },
  editBtnText: {
    ...Typography.button,
  },
  deleteBtn: {
    flex: 1,
    borderWidth: 2.5,
    borderRadius: Border.radius,
    paddingVertical: 15,
    alignItems: 'center',
  },
  deleteBtnText: {
    ...Typography.button,
    color: NB.black,
  },
});
