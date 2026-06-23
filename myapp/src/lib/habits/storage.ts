import AsyncStorage from '@react-native-async-storage/async-storage';

import { Habit, today, yesterday } from './types';

const STORAGE_KEY = 'streaks_habits_v1';

function isFrequency(value: unknown): value is Habit['frequency'] {
  if (!value || typeof value !== 'object') return false;
  const frequency = value as Record<string, unknown>;
  const hasTime =
    typeof frequency.hour === 'number' &&
    frequency.hour >= 0 &&
    frequency.hour <= 23 &&
    typeof frequency.minute === 'number' &&
    frequency.minute >= 0 &&
    frequency.minute <= 59;

  if (frequency.kind === 'daily') return hasTime;
  return (
    frequency.kind === 'weekly' &&
    hasTime &&
    Array.isArray(frequency.weekdays) &&
    frequency.weekdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)
  );
}

function isHabit(value: unknown): value is Habit {
  if (!value || typeof value !== 'object') return false;
  const habit = value as Record<string, unknown>;
  return (
    typeof habit.id === 'string' &&
    habit.id.length > 0 &&
    typeof habit.name === 'string' &&
    typeof habit.emoji === 'string' &&
    isFrequency(habit.frequency) &&
    Array.isArray(habit.notificationIds) &&
    habit.notificationIds.every((id) => typeof id === 'string') &&
    typeof habit.streak === 'number' &&
    (habit.lastCompletedISO === null || typeof habit.lastCompletedISO === 'string')
  );
}

function normalizeHabits(value: unknown): Habit[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isHabit);
}

export async function loadHabits(): Promise<Habit[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeHabits(JSON.parse(raw));
  } catch (error) {
    console.warn('[habits] Failed to load habits:', error);
    return [];
  }
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

export async function addHabit(habit: Habit): Promise<Habit[]> {
  const habits = await loadHabits();
  const updated = [...habits.filter((item) => item.id !== habit.id), habit];
  await saveHabits(updated);
  return updated;
}

export async function updateHabit(habit: Habit): Promise<Habit[]> {
  const habits = await loadHabits();
  const exists = habits.some((item) => item.id === habit.id);
  const updated = exists
    ? habits.map((item) => (item.id === habit.id ? habit : item))
    : [...habits, habit];
  await saveHabits(updated);
  return updated;
}

export async function deleteHabit(id: string): Promise<Habit[]> {
  const habits = await loadHabits();
  const updated = habits.filter((habit) => habit.id !== id);
  await saveHabits(updated);
  return updated;
}

export async function getHabitById(id: string): Promise<Habit | null> {
  const habits = await loadHabits();
  return habits.find((habit) => habit.id === id) ?? null;
}

export async function markHabitDone(id: string): Promise<Habit | null> {
  const habits = await loadHabits();
  const index = habits.findIndex((habit) => habit.id === id);
  if (index === -1) return null;

  const habit = habits[index];
  const todayStr = today();

  if (habit.lastCompletedISO === todayStr) return habit;

  const updated: Habit = {
    ...habit,
    streak: habit.lastCompletedISO === yesterday() ? habit.streak + 1 : 1,
    lastCompletedISO: todayStr,
  };

  habits[index] = updated;
  await saveHabits(habits);
  return updated;
}

export async function reconcileStreaks(): Promise<void> {
  const habits = await loadHabits();
  const todayStr = today();
  const yesterdayStr = yesterday();

  let changed = false;
  const updated = habits.map((habit) => {
    if (
      habit.lastCompletedISO !== null &&
      habit.lastCompletedISO !== todayStr &&
      habit.lastCompletedISO !== yesterdayStr &&
      habit.streak !== 0
    ) {
      changed = true;
      return { ...habit, streak: 0 };
    }
    return habit;
  });

  if (changed) await saveHabits(updated);
}
