import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PermissionStatus } from 'expo-notifications';
import Constants from 'expo-constants';

import { getPermissionStatus, requestPermission, openSettings } from '@/lib/notifications/permissions';
import { scheduleHabitReminders, cancelHabitReminders } from '@/lib/notifications/schedule';
import { loadHabits, updateHabit } from '@/lib/habits/storage';
import { createAndroidChannel } from '@/lib/notifications/setup';

function N() {
  if (Constants.appOwnership === 'expo') {
    return null;
  }
  return require('expo-notifications') as typeof import('expo-notifications');
}

const REMINDERS_ENABLED_KEY = 'streaks_reminders_enabled_v1';
const LAST_SCHEDULED_KEY = 'streaks_last_scheduled_time_v1';

export type UseNotificationsResult = {
  permissionStatus: PermissionStatus | null;
  isLoadingPermission: boolean;
  requestPermission: () => Promise<void>;
  openSettings: () => Promise<void>;

  remindersEnabled: boolean;
  isTogglingReminders: boolean;
  toggleReminders: (customHabitsList?: any[]) => Promise<void>;

  scheduledCount: number;
  scheduledIds: string[];
  lastScheduledTime: string | null;
  refreshScheduled: () => Promise<void>;

  triggerTestNotification: (seconds?: number) => Promise<boolean>;
  cancelAllScheduledNotifications: () => Promise<void>;
};

export function useNotifications(): UseNotificationsResult {
  // ── Permission State ──
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [isLoadingPermission, setIsLoadingPermission] = useState(true);

  // ── Reminders State ──
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [isTogglingReminders, setIsTogglingReminders] = useState(false);

  // ── Scheduled State ──
  const [scheduledCount, setScheduledCount] = useState(0);
  const [scheduledIds, setScheduledIds] = useState<string[]>([]);
  const [lastScheduledTime, setLastScheduledTime] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Load Initial Configuration ──
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // 1. Permissions
      try {
        const s = await getPermissionStatus();
        if (!cancelled) {
          setPermissionStatus(s);
          setIsLoadingPermission(false);
        }
      } catch {
        if (!cancelled) setIsLoadingPermission(false);
      }

      // 2. Global Reminders Enabled Toggle
      try {
        const enabled = await AsyncStorage.getItem(REMINDERS_ENABLED_KEY);
        if (!cancelled) {
          setRemindersEnabled(enabled !== 'false');
        }
      } catch (e) {
        console.warn('Failed to load reminders status:', e);
      }

      // 3. Last Scheduled Time
      try {
        const lastTime = await AsyncStorage.getItem(LAST_SCHEDULED_KEY);
        if (!cancelled) {
          setLastScheduledTime(lastTime);
        }
      } catch (e) {
        console.warn('Failed to load last scheduled time:', e);
      }

      // 4. Scheduled Reminders List
      await refreshScheduled();
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Refresh Scheduled Reminders ──
  const refreshScheduled = useCallback(async () => {
    try {
      const Notifications = N();
      if (!Notifications) {
        if (mountedRef.current) {
          setScheduledCount(0);
          setScheduledIds([]);
        }
        return;
      }
      const list = await Notifications.getAllScheduledNotificationsAsync();
      if (mountedRef.current) {
        setScheduledCount(list.length);
        setScheduledIds(list.map((item) => item.identifier));
      }
    } catch (error) {
      console.warn('[useNotifications] refreshScheduled error:', error);
    }
  }, []);

  // ── Handle Permission Requests ──
  const handleRequestPermission = useCallback(async () => {
    setIsLoadingPermission(true);
    await createAndroidChannel();
    const s = await requestPermission();
    if (mountedRef.current) {
      setPermissionStatus(s);
      setIsLoadingPermission(false);
    }
  }, []);

  // ── Handle Open Settings ──
  const handleOpenSettings = useCallback(async () => {
    await openSettings();
    // Re-check permission after returning to app
    setTimeout(async () => {
      const s = await getPermissionStatus();
      if (mountedRef.current) {
        setPermissionStatus(s);
      }
    }, 1000);
  }, []);

  // ── Toggle Reminders ON/OFF globally ──
  const toggleReminders = useCallback(async (customHabitsList?: any[]) => {
    if (isTogglingReminders) return;
    setIsTogglingReminders(true);

    const nextVal = !remindersEnabled;
    try {
      if (mountedRef.current) {
        setRemindersEnabled(nextVal);
      }
      await AsyncStorage.setItem(REMINDERS_ENABLED_KEY, nextVal ? 'true' : 'false');

      const habits = customHabitsList || (await loadHabits());

      if (!nextVal) {
        // Toggled OFF: Cancel all active system notifications
        for (const habit of habits) {
          if (habit.notificationIds.length > 0) {
            await cancelHabitReminders(habit.notificationIds);
            await updateHabit({ ...habit, notificationIds: [] });
          }
        }
      } else {
        // Toggled ON: Re-schedule alarms for all habits
        for (const habit of habits) {
          const notificationIds = await scheduleHabitReminders(habit);
          await updateHabit({ ...habit, notificationIds });
        }
        const nowStr = new Date().toLocaleString();
        await AsyncStorage.setItem(LAST_SCHEDULED_KEY, nowStr);
        if (mountedRef.current) {
          setLastScheduledTime(nowStr);
        }
      }
      await refreshScheduled();
    } catch (err) {
      console.warn('Failed to toggle local reminders:', err);
    } finally {
      if (mountedRef.current) {
        setIsTogglingReminders(false);
      }
    }
  }, [remindersEnabled, isTogglingReminders, refreshScheduled]);

  // ── Test Reminder Action ──
  const triggerTestNotification = useCallback(async (seconds: number = 5) => {
    try {
      const allowed = await getPermissionStatus();
      if (allowed !== 'granted') {
        throw new Error('Notification permission not granted.');
      }

      const Notifications = N();
      if (!Notifications) {
        throw new Error('Notifications module not available in this environment.');
      }

      const testTemplates = [
        {
          title: '💧 Time to Hydrate!',
          body: 'Stay healthy—drink a glass of water and keep your streak alive! 💧',
        },
        {
          title: '💻 Coding Time!',
          body: 'Open your editor and write some code. Every line counts! 🚀',
        },
        {
          title: '📚 Reading Reminder',
          body: 'Pick up your book and read for a few minutes today. 📖',
        },
        {
          title: '🏃 Time to Move!',
          body: 'A quick workout today keeps your fitness streak strong. 💪',
        },
        {
          title: '🧘 Find Your Calm',
          body: 'Take a few peaceful minutes to meditate and relax. 🧘',
        },
        {
          title: '🎯 Don\'t Break Your Streak!',
          body: 'Complete today\'s habit and continue your amazing progress! 🔥',
        }
      ];
      const template = testTemplates[Math.floor(Math.random() * testTemplates.length)];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: template.title,
          body: template.body,
          sound: 'default',
          priority: 'high',
          data: {
            screen: '/habit',
            habitId: 'test_habit_id',
          },
        },
        trigger: {
          seconds,
        } as any,
      });

      // Give it a brief delay then refresh the local list
      setTimeout(() => {
        refreshScheduled();
      }, 1000);

      return true;
    } catch (error) {
      console.warn('[useNotifications] Test notification failed:', error);
      throw error;
    }
  }, [refreshScheduled]);

  // ── Debug clear all ──
  const cancelAllScheduledNotifications = useCallback(async () => {
    try {
      const Notifications = N();
      if (!Notifications) return;
      await Notifications.cancelAllScheduledNotificationsAsync();
      const habits = await loadHabits();
      for (const habit of habits) {
        if (habit.notificationIds.length > 0) {
          await updateHabit({ ...habit, notificationIds: [] });
        }
      }
      await refreshScheduled();
    } catch (error) {
      console.warn('[useNotifications] cancelAllScheduledNotifications error:', error);
    }
  }, [refreshScheduled]);

  // ── AppState Listener for Permission Updates ──
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        try {
          const s = await getPermissionStatus();
          if (mountedRef.current) {
            setPermissionStatus(s);
          }
        } catch {
          // ignore
        }
        await refreshScheduled();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [refreshScheduled]);

  return {
    permissionStatus,
    isLoadingPermission,
    requestPermission: handleRequestPermission,
    openSettings: handleOpenSettings,

    remindersEnabled,
    isTogglingReminders,
    toggleReminders,

    scheduledCount,
    scheduledIds,
    lastScheduledTime,
    refreshScheduled,

    triggerTestNotification,
    cancelAllScheduledNotifications,
  };
}
