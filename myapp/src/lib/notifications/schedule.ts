import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, Frequency } from '@/lib/habits/types';
import { CHANNEL_ID, createAndroidChannel } from './setup';

function N() {
  return require('expo-notifications') as typeof import('expo-notifications');
}

async function hasNotificationPermission(): Promise<boolean> {
  const Notifications = N();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function scheduleHabitReminders(habit: Habit): Promise<string[]> {
  const ids: string[] = [];

  try {
    const enabled = await AsyncStorage.getItem('streaks_reminders_enabled_v1');
    if (enabled === 'false') return ids;

    await createAndroidChannel();

    const Notifications = N();
    const allowed = await hasNotificationPermission();
    if (!allowed) return ids;

    const content = {
      title: `${habit.emoji} ${habit.name}`,
      body: 'Tap to log it.',
      sound: 'default',
      data: {
        url: `/habit/${habit.id}`,
        screen: '/habit',
        habitId: habit.id,
      },
    };

    if (habit.frequency.kind === 'daily') {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: habit.frequency.hour,
          minute: habit.frequency.minute,
          channelId: CHANNEL_ID,
        },
      });
      ids.push(notificationId);
    } else {
      for (const weekday of habit.frequency.weekdays) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: weekday + 1,
            hour: habit.frequency.hour,
            minute: habit.frequency.minute,
            channelId: CHANNEL_ID,
          },
        });
        ids.push(notificationId);
      }
    }
    if (ids.length > 0) {
      await AsyncStorage.setItem('streaks_last_scheduled_time_v1', new Date().toLocaleString());
    }
  } catch (error) {
    console.warn('[notifications] Failed to schedule habit reminders:', error);
  }

  return ids;
}

export async function cancelHabitReminders(notificationIds: string[]): Promise<void> {
  if (notificationIds.length === 0) return;

  try {
    const Notifications = N();
    await Promise.all(
      notificationIds.map((id) =>
        Notifications.cancelScheduledNotificationAsync(id).catch((error) => {
          console.warn('[notifications] Failed to cancel reminder:', id, error);
        })
      )
    );
  } catch (error) {
    console.warn('[notifications] Failed to cancel reminders:', error);
  }
}

export async function rescheduleHabit(habit: Habit): Promise<string[]> {
  await cancelHabitReminders(habit.notificationIds);
  return scheduleHabitReminders({ ...habit, notificationIds: [] });
}

export function buildDailyFrequency(hour: number, minute: number): Frequency {
  return { kind: 'daily', hour, minute };
}

export function buildWeeklyFrequency(
  weekdays: number[],
  hour: number,
  minute: number
): Frequency {
  return { kind: 'weekly', weekdays, hour, minute };
}
