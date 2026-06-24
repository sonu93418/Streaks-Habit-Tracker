import { useRouter } from 'expo-router';
import React, { useMemo, useState, useEffect } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { HabitCard } from '@/components/habit-card';
import { Border, BottomTabInset, NB, Shadow, Spacing, Typography } from '@/constants/theme';
import { useHabits } from '@/hooks/useHabits';
import { useTheme } from '@/hooks/useTheme';
import { habitIsActiveToday, today } from '@/lib/habits/types';
import { Pressable3D } from '@/components/pressable-3d';
import { Confetti } from '@/components/confetti';

function getGreeting(): string {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning ☀️';
  if (hr < 17) return 'Good afternoon 🌤️';
  return 'Good evening 🌙';
}

export default function TodayScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { habits, isLoading, isRefreshing, refresh, markDone, error } = useHabits();

  const [confettiActive, setConfettiActive] = useState(false);

  // Redirection check for onboarding completion on startup
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('streaks_onboarding_completed_v1');
        if (completed !== 'true') {
          router.replace('/onboarding' as any);
        }
      } catch (err) {
        router.replace('/onboarding' as any);
      }
    };
    checkOnboarding();
  }, [router]);

  // Pulsing animation for the streak flame icon
  const flameScale = useSharedValue(1);
  useEffect(() => {
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, [flameScale]);

  const animatedFlameStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: flameScale.value }],
    };
  });

  // Recalculate max streak
  const maxStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return habits.reduce((max, h) => Math.max(max, h.streak), 0);
  }, [habits]);

  const todayStr = today();

  const sortedHabits = useMemo(
    () =>
      [...habits].sort((a, b) => {
        const aActive = habitIsActiveToday(a) ? 0 : 1;
        const bActive = habitIsActiveToday(b) ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return a.name.localeCompare(b.name);
      }),
    [habits]
  );

  const activeTodayCount = habits.filter(habitIsActiveToday).length;
  const doneCount = habits.filter((habit) => habit.lastCompletedISO === todayStr).length;
  const allDone = activeTodayCount > 0 && doneCount === activeTodayCount;

  const handleMarkDone = async (id: string) => {
    const res = await markDone(id);
    if (res) {
      setConfettiActive(true);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ── Personalized Greeting & Mascot Row ─────────────────────────────── */}
        <View style={styles.greetingRow}>
          <View
            style={[
              styles.greetingCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: Border.width,
                ...Shadow.medium,
              },
            ]}
          >
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              {allDone ? 'All Done! 🎉' : 'Today’s Goals'}
            </Text>
          </View>

          {/* Cute 3D mascot avatar block */}
          <View style={styles.mascotContainer}>
            <View style={styles.mascotShadow} />
            <View style={[styles.mascotWrapper, { borderWidth: Border.width }]}>
              <Image
                source={require('../../../assets/images/mascot.png')}
                style={styles.mascotImage}
              />
            </View>
          </View>
        </View>

        {/* ══ STREAK CARD ════════════════════════════════════════════════════ */}
        {habits.length > 0 && (
          <View
            style={[
              styles.streakCard,
              {
                backgroundColor: NB.yellow,
                borderColor: NB.black,
                borderWidth: Border.width,
                ...Shadow.medium,
              },
            ]}
          >
            <Animated.View style={[styles.streakFlameWrapper, animatedFlameStyle]}>
              <Image
                source={require('../../../assets/images/onboarding_3.png')}
                style={styles.streakFlameImage}
              />
            </Animated.View>

            <View style={styles.streakCopy}>
              <Text style={styles.streakTag}>STREAK MASTER</Text>
              <Text style={styles.streakValue}>
                {maxStreak} Day{maxStreak === 1 ? '' : 's'}
              </Text>
              <Text style={styles.streakSub}>
                {maxStreak > 0
                  ? 'Awesome! Keep the chain alive.'
                  : 'Complete a habit to start your streak!'}
              </Text>
            </View>
          </View>
        )}



        {error && (
          <View style={[styles.errorBox, { borderColor: NB.black, backgroundColor: NB.coral }]}>
            <Text style={styles.errorText}>Could not refresh habits. Pull down to retry.</Text>
          </View>
        )}

        {/* ── Habit Progress Pill/Bar ─────────────────────────────── */}
        {habits.length > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: theme.text }]}>Progress</Text>
              <View
                style={[
                  styles.progressPill,
                  {
                    backgroundColor: allDone ? NB.green : NB.yellow,
                    borderColor: NB.black,
                    borderWidth: 2,
                  },
                ]}
              >
                <Text style={styles.progressText}>
                  {doneCount}/{activeTodayCount || habits.length} Done
                </Text>
              </View>
            </View>

            <View style={[styles.progressBarBg, { borderColor: theme.border, borderWidth: Border.width }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${activeTodayCount ? (doneCount / activeTodayCount) * 100 : 0}%`,
                    backgroundColor: allDone ? NB.green : NB.yellow,
                  },
                ]}
              />
            </View>
          </View>
        )}

        <FlatList
          data={sortedHabits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              onPress={() => router.push(`/habit/${item.id}` as any)}
              onMarkDone={() => handleMarkDone(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => refresh(true)}
              tintColor={NB.black}
              colors={[NB.black]}
            />
          }
          contentContainerStyle={[
            styles.list,
            sortedHabits.length === 0 && styles.emptyList,
            { paddingBottom: BottomTabInset + Spacing.five },
          ]}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.centerState}>
                <Text style={styles.stateEmoji}>⏳</Text>
                <Text style={[styles.stateText, { color: theme.textSecondary }]}>
                  Loading habits...
                </Text>
              </View>
            ) : (
              <View style={styles.centerState}>
                {/* 3D Sprout Empty State Illustration */}
                <View style={styles.emptyCardContainer}>
                  <View style={styles.emptyCardShadow} />
                  <View style={[styles.emptyCard, { borderWidth: Border.width }]}>
                    <Image
                      source={require('../../../assets/images/empty_state.png')}
                      style={styles.emptyImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                <Text style={[styles.stateTitle, { color: theme.text }]}>
                  Build your first streak
                </Text>
                <Text style={[styles.stateText, { color: theme.textSecondary }]}>
                  Add a habit, pick a reminder, and keep the chain alive.
                </Text>

                <Pressable3D
                  onPress={() => router.push('/add' as any)}
                  style={styles.emptyBtnContainer}
                  contentStyle={[styles.emptyBtn, { backgroundColor: NB.yellow }]}
                  shadowDepth={5}
                >
                  <Text style={styles.emptyBtnText}>+ Create Habit</Text>
                </Pressable3D>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />

        {/* ── Floating Add Button ─────────────────────────────── */}
        {habits.length > 0 && (
          <Pressable3D
            onPress={() => router.push('/add' as any)}
            style={styles.fabContainer}
            contentStyle={[styles.fab, { backgroundColor: NB.yellow }]}
            shadowDepth={5}
          >
            <Text style={styles.fabText}>+</Text>
          </Pressable3D>
        )}
      </SafeAreaView>

      {/* Confetti Explosion Celebrator */}
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    height: 90,
  },
  greetingCard: {
    flex: 1,
    height: '100%',
    borderRadius: Border.radiusLg,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  dateLabel: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    ...Typography.screenTitle,
  },
  mascotContainer: {
    width: 90,
    height: 90,
    position: 'relative',
  },
  mascotShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: -5,
    bottom: -5,
    backgroundColor: '#000000',
    borderRadius: Border.radiusLg,
  },
  mascotWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF2DC',
    borderColor: '#000000',
    borderRadius: Border.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mascotImage: {
    width: '80%',
    height: '80%',
  },
  // ── Streak Card ──
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Border.radiusLg,
    padding: 16,
    marginBottom: 20,
    gap: 16,
  },
  streakFlameWrapper: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakFlameImage: {
    width: '100%',
    height: '100%',
  },
  streakCopy: {
    flex: 1,
  },
  streakTag: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.5,
    color: '#000000',
  },
  streakValue: {
    ...Typography.sectionHeading,
    color: '#000000',
  },
  streakSub: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#4A4A4A',
    marginTop: 2,
  },
  errorBox: {
    borderWidth: Border.width,
    borderColor: '#000000',
    borderRadius: Border.radiusSm,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#000000',
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  // ── Progress Section ──
  progressSection: {
    marginBottom: 16,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    ...Typography.body,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  progressPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  progressText: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#000000',
  },
  progressBarBg: {
    height: 16,
    borderRadius: 999,
    borderColor: '#000000',
    backgroundColor: '#FAF2DC',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  list: {
    paddingTop: 4,
  },
  emptyList: {
    flexGrow: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: BottomTabInset + 40,
    gap: 12,
  },
  emptyCardContainer: {
    width: 140,
    height: 140,
    position: 'relative',
    marginBottom: 10,
  },
  emptyCardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: -5,
    bottom: -5,
    backgroundColor: '#000000',
    borderRadius: 24,
  },
  emptyCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF2DC',
    borderColor: '#000000',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptyImage: {
    width: '80%',
    height: '80%',
  },
  stateEmoji: {
    fontSize: 54,
  },
  stateTitle: {
    ...Typography.sectionHeading,
    textAlign: 'center',
  },
  stateText: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: 28,
    color: '#4A4A4A',
  },
  emptyBtnContainer: {
    marginTop: 12,
    width: 180,
    height: 52,
  },
  emptyBtn: {
    height: 52,
    borderWidth: Border.width,
    borderColor: '#000000',
    borderRadius: Border.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    ...Typography.button,
    color: '#000000',
  },
  fabContainer: {
    position: 'absolute',
    bottom: BottomTabInset + 12,
    right: 20,
    width: 60,
    height: 60,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: Border.width,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 32,
    color: '#000000',
    marginTop: -2,
  },
});
