import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useReducer } from 'react';

import {
  addHabit,
  deleteHabit,
  loadHabits,
  markHabitDone,
  reconcileStreaks,
  updateHabit,
} from '@/lib/habits/storage';
import { Habit, HabitFormData } from '@/lib/habits/types';
import {
  cancelHabitReminders,
  scheduleHabitReminders,
} from '@/lib/notifications/schedule';

type State = {
  habits: Habit[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

type Action =
  | { type: 'LOAD_START'; refreshing: boolean }
  | { type: 'LOAD_SUCCESS'; habits: Habit[] }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'SET_HABITS'; habits: Habit[] };

const listeners = new Set<() => void>();

function notifyHabitChange() {
  listeners.forEach((listener) => listener());
}

function createHabitId(): string {
  return `habit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...state,
        isLoading: action.refreshing ? state.isLoading : true,
        isRefreshing: action.refreshing,
        error: null,
      };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        habits: action.habits,
        isLoading: false,
        isRefreshing: false,
        error: null,
      };
    case 'LOAD_ERROR':
      return {
        ...state,
        isLoading: false,
        isRefreshing: false,
        error: action.error,
      };
    case 'SET_HABITS':
      return {
        ...state,
        habits: action.habits,
        isLoading: false,
        isRefreshing: false,
        error: null,
      };
    default:
      return state;
  }
}

export function useHabits() {
  const [state, dispatch] = useReducer(reducer, {
    habits: [],
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const refresh = useCallback(async (refreshing = false) => {
    dispatch({ type: 'LOAD_START', refreshing });
    try {
      await reconcileStreaks();
      const habits = await loadHabits();
      dispatch({ type: 'LOAD_SUCCESS', habits });
      return habits;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('[habits] Refresh failed:', error);
      dispatch({ type: 'LOAD_ERROR', error: message });
      return [];
    }
  }, []);

  useEffect(() => {
    listeners.add(refresh);
    refresh();
    return () => {
      listeners.delete(refresh);
    };
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const createHabit = useCallback(async (formData: HabitFormData) => {
    const name = formData.name.trim();
    if (!name) throw new Error('Habit name is required.');

    const habit: Habit = {
      id: createHabitId(),
      name,
      emoji: formData.emoji,
      frequency: formData.frequency,
      notificationIds: [],
      streak: 0,
      lastCompletedISO: null,
      category: formData.category,
      color: formData.color,
    };

    await addHabit(habit);

    let savedHabit = habit;
    try {
      const notificationIds = await scheduleHabitReminders(habit);
      savedHabit = { ...habit, notificationIds };
      await updateHabit(savedHabit);
    } catch (error) {
      console.warn('[habits] Habit saved, but reminder scheduling failed:', error);
    }

    const habits = await loadHabits();
    dispatch({ type: 'SET_HABITS', habits });
    notifyHabitChange();
    return savedHabit;
  }, []);

  const editHabit = useCallback(async (id: string, formData: HabitFormData) => {
    const name = formData.name.trim();
    if (!name) throw new Error('Habit name is required.');

    const habits = await loadHabits();
    const existing = habits.find((habit) => habit.id === id);
    if (!existing) throw new Error('Habit not found.');

    await cancelHabitReminders(existing.notificationIds);

    let notificationIds: string[] = [];
    const draft: Habit = {
      ...existing,
      name,
      emoji: formData.emoji,
      frequency: formData.frequency,
      notificationIds: [],
      category: formData.category,
      color: formData.color,
    };

    try {
      notificationIds = await scheduleHabitReminders(draft);
    } catch (error) {
      console.warn('[habits] Habit updated, but reminder scheduling failed:', error);
    }

    const updated: Habit = { ...draft, notificationIds };
    const nextHabits = await updateHabit(updated);
    dispatch({ type: 'SET_HABITS', habits: nextHabits });
    notifyHabitChange();
    return updated;
  }, []);

  const removeHabit = useCallback(async (id: string) => {
    const habits = await loadHabits();
    const habit = habits.find((item) => item.id === id);
    if (!habit) return;

    await cancelHabitReminders(habit.notificationIds);
    const nextHabits = await deleteHabit(id);
    dispatch({ type: 'SET_HABITS', habits: nextHabits });
    notifyHabitChange();
  }, []);

  const markDone = useCallback(async (id: string) => {
    const updated = await markHabitDone(id);
    if (!updated) return null;
    const habits = await loadHabits();
    dispatch({ type: 'SET_HABITS', habits });
    notifyHabitChange();
    return updated;
  }, []);

  return {
    habits: state.habits,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    refresh,
    createHabit,
    editHabit,
    removeHabit,
    markDone,
  };
}
