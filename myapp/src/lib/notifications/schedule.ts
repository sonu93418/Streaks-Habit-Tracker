import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, Frequency } from '@/lib/habits/types';
import { CHANNEL_ID, createAndroidChannel } from './setup';
import Constants from 'expo-constants';

function N() {
  if (Constants.appOwnership === 'expo') {
    return null;
  }
  return require('expo-notifications') as typeof import('expo-notifications');
}

async function hasNotificationPermission(): Promise<boolean> {
  const Notifications = N();
  if (!Notifications) return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export interface NotificationContent {
  title: string;
  body: string;
}

export function getHabitNotificationContent(habit: Habit): NotificationContent {
  const nameLower = habit.name.toLowerCase();
  const emoji = habit.emoji;

  // 1. Water
  if (
    emoji === '💧' ||
    nameLower.includes('water') ||
    nameLower.includes('hydrate') ||
    nameLower.includes('drink')
  ) {
    return {
      title: '💧 Time to Hydrate!',
      body: 'Stay healthy—drink a glass of water and keep your streak alive!',
    };
  }

  // 2. Code
  if (
    emoji === '💻' ||
    nameLower.includes('code') ||
    nameLower.includes('coding') ||
    nameLower.includes('program') ||
    nameLower.includes('develop')
  ) {
    return {
      title: '💻 Coding Time!',
      body: 'Open your editor and write some code. Every line counts! 🚀',
    };
  }

  // 3. Read
  if (
    emoji === '📚' ||
    nameLower.includes('read') ||
    nameLower.includes('reading') ||
    nameLower.includes('book')
  ) {
    return {
      title: '📚 Reading Reminder',
      body: 'Pick up your book and read for a few minutes today. 📖',
    };
  }

  // 4. Workout
  if (
    emoji === '🏃' ||
    nameLower.includes('workout') ||
    nameLower.includes('exercise') ||
    nameLower.includes('run') ||
    nameLower.includes('gym') ||
    nameLower.includes('fitness') ||
    nameLower.includes('sport') ||
    nameLower.includes('move')
  ) {
    return {
      title: '🏃 Time to Move!',
      body: 'A quick workout today keeps your fitness streak strong. 💪',
    };
  }

  // 5. Coffee
  if (
    emoji === '☕' ||
    nameLower.includes('coffee') ||
    nameLower.includes('tea') ||
    nameLower.includes('break')
  ) {
    return {
      title: '☕ Take a Refreshing Break',
      body: 'Enjoy a mindful coffee break, then get back to your goals.',
    };
  }

  // 6. Sleep
  if (
    emoji === '😴' ||
    emoji === '🌙' ||
    nameLower.includes('sleep') ||
    nameLower.includes('bedtime') ||
    nameLower.includes('rest') ||
    nameLower.includes('recharge')
  ) {
    return {
      title: '🌙 Bedtime Reminder',
      body: "It's time to rest and recharge for tomorrow. 🛌",
    };
  }

  // 7. Meditation
  if (
    emoji === '🧘' ||
    nameLower.includes('meditat') ||
    nameLower.includes('yoga') ||
    nameLower.includes('relax') ||
    nameLower.includes('calm') ||
    nameLower.includes('mindful')
  ) {
    return {
      title: '🧘 Find Your Calm',
      body: 'Take a few peaceful minutes to meditate and relax.',
    };
  }

  // 8. Eating
  if (
    emoji === '🍎' ||
    nameLower.includes('eat') ||
    nameLower.includes('food') ||
    nameLower.includes('meal') ||
    nameLower.includes('healthy eating') ||
    nameLower.includes('diet') ||
    nameLower.includes('nourish')
  ) {
    return {
      title: '🍎 Eat Healthy Today',
      body: 'Choose a healthy meal and nourish your body.',
    };
  }

  // 9. Walk
  if (
    emoji === '🚶' ||
    nameLower.includes('walk') ||
    nameLower.includes('step') ||
    nameLower.includes('stroll') ||
    nameLower.includes('hiking') ||
    nameLower.includes('hike')
  ) {
    return {
      title: "🚶 Let's Go for a Walk",
      body: 'A short walk can boost your mood and energy.',
    };
  }

  // 10. Journal
  if (
    emoji === '✍️' ||
    nameLower.includes('journal') ||
    nameLower.includes('diary') ||
    nameLower.includes('write') ||
    nameLower.includes('reflect') ||
    nameLower.includes('thought')
  ) {
    return {
      title: '✍️ Write Your Thoughts',
      body: 'Reflect on your day and keep your journaling habit alive.',
    };
  }

  // 11. Fallback General Habit / Streak Motivation
  const streakMsgs = [
    "🔥 You're on a roll! Complete today's habit to protect your streak.",
    '🌟 Small actions every day lead to big results.',
    '🚀 Your future self will thank you for staying consistent.',
    '💪 Consistency beats perfection—keep going!',
    '🎉 One tap away from another successful day!',
  ];
  const hash = habit.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const streakMsg = streakMsgs[hash % streakMsgs.length];

  const combination = hash % 2;
  if (combination === 0) {
    return {
      title: "🎯 Don't Break Your Streak!",
      body: `Complete today's habit and continue your amazing progress! 🔥\n${streakMsg}`,
    };
  } else {
    return {
      title: `🔥 Time for ${habit.name}!`,
      body: `Keep your streak alive! Complete your ${habit.name} habit now. 🚀\n${streakMsg}`,
    };
  }
}

export async function scheduleHabitReminders(habit: Habit): Promise<string[]> {
  const ids: string[] = [];

  try {
    const enabled = await AsyncStorage.getItem('streaks_reminders_enabled_v1');
    if (enabled === 'false') return ids;

    const Notifications = N();
    if (!Notifications) return ids;

    await createAndroidChannel();

    const allowed = await hasNotificationPermission();
    if (!allowed) return ids;

    const customContent = getHabitNotificationContent(habit);
    const content = {
      title: customContent.title,
      body: customContent.body,
      sound: 'default',
      priority: 'high',
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
    if (!Notifications) return;
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
