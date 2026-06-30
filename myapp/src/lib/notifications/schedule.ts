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

function sanitizeContent(text: string | null | undefined, fallback: string): string {
  if (!text) return fallback;
  const trimmed = text.trim();
  if (trimmed === '') return fallback;
  return trimmed;
}

// ─── Streak milestone suffix ──────────────────────────────────────────────────

function streakSuffix(streak: number): string {
  if (streak <= 0) return 'Start your streak today! 🚀';
  if (streak === 1) return 'Day 1 done — keep it going tomorrow. 🔥';
  if (streak < 7) return `${streak} days strong — don't break the chain! 🔥`;
  if (streak === 7) return 'One full week! You\'re on a roll. 🎉';
  if (streak < 14) return `${streak}-day streak — real habit forming! 💪`;
  if (streak === 14) return 'Two weeks straight! You\'re unstoppable. 🏆';
  if (streak < 30) return `${streak} days! Elite consistency. Keep going! ⚡`;
  if (streak === 30) return '30-day milestone! You\'re a habit master. 🥇';
  return `${streak}-day legend streak — incredible discipline! 🏅`;
}

// ─── Habit-type templates ─────────────────────────────────────────────────────

type Template = { title: string; bodies: string[] };

/**
 * Pick a body line using the habit id as a stable seed so the same habit
 * always gets the same variant, but different habits get different copy.
 */
function pickBody(bodies: string[], habitId: string): string {
  const seed = habitId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return bodies[seed % bodies.length];
}

function getTemplate(emoji: string, nameLower: string): Template | null {
  // Hydration
  if (emoji === '💧' || nameLower.includes('water') || nameLower.includes('hydrat') || nameLower.includes('drink')) {
    return { title: '💧 Hydration Time', bodies: [
      'Your body is 60% water — top it up right now.',
      'A glass of water a day keeps fatigue away. Drink up!',
      'Hydrated brains think faster. Pour yourself a glass. 💧',
      'Small sip, big difference. Drink your water!',
    ]};
  }
  // Strength / Gym
  if (emoji === '🏋️' || nameLower.includes('lift') || nameLower.includes('strength') || nameLower.includes('weights') || nameLower.includes('gym')) {
    return { title: '🏋️ Strength Training', bodies: [
      "The weights are waiting. Let's build something strong today! 💪",
      'One more session closer to your goals. Hit the gym!',
      'Progress is made rep by rep. Go crush it! 🏋️',
      'Sore today, strong tomorrow. Time to train! 💥',
    ]};
  }
  // Reading
  if (emoji === '📚' || nameLower.includes('read') || nameLower.includes('book')) {
    return { title: '📚 Reading Time', bodies: [
      '10 pages a day = 12 books a year. Open yours now.',
      'The best investment: reading a few pages today. 📖',
      'Readers are leaders. Spend 15 minutes with your book.',
      'A new chapter is waiting for you — dive in! 📚',
    ]};
  }
  // Running / Cardio
  if (emoji === '🏃' || nameLower.includes('run') || nameLower.includes('jog') || nameLower.includes('cardio')) {
    return { title: '🏃 Time to Run', bodies: [
      'Lace up. Every step counts toward your goal! 🏃',
      'Your lungs are ready. Hit the pavement!',
      "The hardest part is starting. You've got this. Go! 🔥",
      "Miles don't run themselves. Let's go! 👟",
    ]};
  }
  // General workout
  if (nameLower.includes('workout') || nameLower.includes('exercise') || nameLower.includes('active') || nameLower.includes('training')) {
    return { title: '💪 Workout Reminder', bodies: [
      'Move your body. Your future self is counting on you! 💪',
      'No excuses — just reps. Time to get active.',
      'Energy creates energy. Start moving and feel the shift. ⚡',
      'A workout you regret? Never. Get it done!',
    ]};
  }
  // Meditation / Yoga
  if (emoji === '🧘' || nameLower.includes('meditat') || nameLower.includes('yoga') || nameLower.includes('mindful') || nameLower.includes('calm')) {
    return { title: '🧘 Mindfulness Practice', bodies: [
      'Close your eyes. Breathe in. Breathe out. You have 10 minutes. 🧘',
      'A calm mind is a powerful mind. Time to meditate.',
      'Pause the noise. Find your stillness right now.',
      "You can't pour from an empty cup. Refill with mindfulness.",
    ]};
  }
  // Sleep
  if (emoji === '😴' || emoji === '🌙' || nameLower.includes('sleep') || nameLower.includes('bedtime') || nameLower.includes('rest')) {
    return { title: '🌙 Wind Down', bodies: [
      'Screen off, eyes closed. Your recovery starts now. 🌙',
      'Sleep is your superpower. Protect it tonight.',
      'Rest is productive. Prioritize your sleep tonight. 😴',
      "Tomorrow's performance is built on tonight's sleep.",
    ]};
  }
  // Medication / Vitamins
  if (emoji === '💊' || nameLower.includes('pill') || nameLower.includes('vitamin') || nameLower.includes('medicine') || nameLower.includes('supplement')) {
    return { title: '💊 Medication Reminder', bodies: [
      "Don't forget your supplement — consistency is everything! 💊",
      'Time to take your medicine. Stay on track.',
      'A small pill, a big commitment. Take it now.',
      'Your health routine matters. Medication time!',
    ]};
  }
  // Study / Learning
  if (emoji === '🧠' || nameLower.includes('study') || nameLower.includes('learn') || nameLower.includes('course') || nameLower.includes('lesson')) {
    return { title: '🧠 Study Session', bodies: [
      'Knowledge compounds daily. Open your notes and get to work. 📖',
      '30 focused minutes > 3 distracted hours. Start now.',
      'Your future self thanks you for studying today. ⚡',
      "Sharpen your mind — today's lesson is waiting.",
    ]};
  }
  // Journaling / Writing
  if (emoji === '✍️' || nameLower.includes('journal') || nameLower.includes('writ') || nameLower.includes('diary')) {
    return { title: '✍️ Journaling Time', bodies: [
      'Put your thoughts on paper. Clarity comes from writing. ✍️',
      '5 minutes of journaling can transform your perspective.',
      'Document your progress — your future self will love this.',
      'The pen is mightier. Pick it up and write. 📓',
    ]};
  }
  // Art / Creative
  if (emoji === '🎨' || nameLower.includes('art') || nameLower.includes('paint') || nameLower.includes('draw') || nameLower.includes('creative') || nameLower.includes('sketch')) {
    return { title: '🎨 Creative Time', bodies: [
      'Your canvas is waiting. Express yourself! 🖌️',
      'Creativity is a muscle — flex it today.',
      'Art is never finished, only started. Begin now. 🎨',
      'Let your imagination run free for a few minutes.',
    ]};
  }
  // Music
  if (emoji === '🎵' || nameLower.includes('music') || nameLower.includes('guitar') || nameLower.includes('piano') || nameLower.includes('instrument') || nameLower.includes('practice')) {
    return { title: '🎵 Music Practice', bodies: [
      'Pick up your instrument. Even 15 minutes counts. 🎶',
      'Musicians are made in the practice room, not on stage.',
      'Your fingers remember what your mind forgets. Play! 🎵',
      'One session closer to mastery. Time to practice.',
    ]};
  }
  // Walking
  if (emoji === '🚶' || nameLower.includes('walk') || nameLower.includes('steps') || nameLower.includes('stroll')) {
    return { title: '🚶 Daily Walk', bodies: [
      'A 20-minute walk clears the mind and body. Go! 🚶',
      'Fresh air and footsteps — the best combination.',
      'Every step is a vote for a healthier you. Walk it out.',
      'Step outside. Nature is the best reset button.',
    ]};
  }
  // Cycling
  if (emoji === '🚴' || nameLower.includes('bike') || nameLower.includes('cycl') || nameLower.includes('ride')) {
    return { title: '🚴 Cycling Session', bodies: [
      'Wheels rolling, mind clearing. Time to ride! 🚴',
      "Your bike is ready. Are you? Let's go!",
      'Pedal by pedal, goal by goal. Get on your bike.',
      'Feel the breeze and burn those calories. Ride time!',
    ]};
  }
  // Swimming
  if (emoji === '🏊' || nameLower.includes('swim') || nameLower.includes('pool')) {
    return { title: '🏊 Swim Session', bodies: [
      'The pool is calling. Dive in and feel great! 🏊',
      'Every lap builds endurance. Time to swim.',
      'Water therapy: great for body and mind.',
      "Make a splash with today's swim session! 🌊",
    ]};
  }
  // Stretching
  if (emoji === '🤸' || nameLower.includes('stretch') || nameLower.includes('flexib') || nameLower.includes('mobility')) {
    return { title: '🤸 Stretch & Mobility', bodies: [
      'Loose muscles, clear mind. Roll out the mat! 🤸',
      'Flexibility is longevity. Stretch for 10 minutes.',
      'Your body wants to move — give it a good stretch.',
      'Tight muscles slow you down. Loosen up right now.',
    ]};
  }
  // Healthy eating / nutrition
  if (emoji === '🥗' || emoji === '🍎' || nameLower.includes('diet') || nameLower.includes('nutrition') || nameLower.includes('eat healthy') || nameLower.includes('meal')) {
    return { title: '🥗 Healthy Eating', bodies: [
      'You are what you eat — make it count today! 🥗',
      'One nutritious meal at a time. Choose wisely.',
      'Fuel your ambitions with real food. Eat healthy!',
      'A rainbow of veggies keeps the doctor away. 🍎',
    ]};
  }
  // Gratitude
  if (emoji === '🙏' || nameLower.includes('gratitude') || nameLower.includes('grateful') || nameLower.includes('thank') || nameLower.includes('pray')) {
    return { title: '🙏 Gratitude Practice', bodies: [
      "Name 3 things you're grateful for right now. 🙏",
      'Gratitude shifts your perspective. Write it down.',
      'A thankful mind is a happy mind. Take a moment.',
      'Count your blessings — literally. Start your list.',
    ]};
  }
  // Morning routine
  if (emoji === '🌅' || nameLower.includes('morning') || nameLower.includes('sunrise') || nameLower.includes('wake up')) {
    return { title: '🌅 Morning Routine', bodies: [
      'How you start your morning shapes your whole day. Rise! 🌅',
      'Winners own their mornings. Start yours right.',
      'The early bird advantage is real. Begin your routine!',
      "A great morning = a great day. Let's get it started. ☀️",
    ]};
  }
  // Planning / Productivity
  if (emoji === '📝' || nameLower.includes('plan') || nameLower.includes('review') || nameLower.includes('task') || nameLower.includes('todo') || nameLower.includes('checklist')) {
    return { title: '📝 Planning Time', bodies: [
      "A plan without action is a dream. What's your next step? 📝",
      'Review your tasks and pick one to do right now.',
      'Clarity comes from writing it down. Plan your day.',
      "5 minutes of planning saves an hour of chaos. Let's go!",
    ]};
  }
  // Deep Work / Focus
  if (emoji === '💼' || nameLower.includes('deep work') || nameLower.includes('focus') || nameLower.includes('work') || nameLower.includes('project')) {
    return { title: '💼 Focus Session', bodies: [
      'Phone down, notifications off. Deep work begins. 💼',
      'One focused hour beats three distracted ones.',
      'Your best work happens when you protect your focus.',
      "Shut out the noise. Let's produce something great today.",
    ]};
  }
  // Self-care
  if (emoji === '🛁' || nameLower.includes('self-care') || nameLower.includes('skincare') || nameLower.includes('shower') || nameLower.includes('bath')) {
    return { title: '🛁 Self-Care Time', bodies: [
      "You can't pour from an empty cup. Take care of yourself. 🛁",
      'Your body deserves attention. Self-care time!',
      'Treat yourself kindly — it starts with this routine.',
      'Refresh, restore, recharge. Self-care is not selfish.',
    ]};
  }
  // Social / Connection
  if (emoji === '🤝' || nameLower.includes('friend') || nameLower.includes('social') || nameLower.includes('connect') || nameLower.includes('family') || nameLower.includes('call')) {
    return { title: '🤝 Connect & Relate', bodies: [
      'Reach out to someone today. Relationships need tending. 🤝',
      'Text a friend. Call a family member. Make the moment.',
      'Strong connections = strong life. Who will you reach today?',
      'Human connection is the best medicine. Reach out!',
    ]};
  }
  // Cleaning / Tidying
  if (emoji === '🧹' || nameLower.includes('clean') || nameLower.includes('tidy') || nameLower.includes('organiz') || nameLower.includes('declutter')) {
    return { title: '🧹 Tidy Time', bodies: [
      'A clean space = a clear mind. Tidy up for 10 minutes. 🧹',
      'Declutter one surface. Small wins add up.',
      "Outer order creates inner calm. Let's clean!",
      'Pick up, organize, reset. Your space will thank you.',
    ]};
  }
  // Coffee / Break
  if (emoji === '☕' || nameLower.includes('coffee') || nameLower.includes('tea') || nameLower.includes('break')) {
    return { title: '☕ Mindful Break', bodies: [
      'Brew your drink, breathe deeply, reset your mind. ☕',
      "You've earned a proper break. Enjoy it mindfully.",
      'Step away from the screen for a few minutes. Tea time!',
      'A good break makes the next hour 10× more productive.',
    ]};
  }
  // Growth / general habits
  if (emoji === '🌱' || nameLower.includes('grow') || nameLower.includes('habit') || nameLower.includes('improve') || nameLower.includes('better')) {
    return { title: '🌱 Keep Growing', bodies: [
      "Small daily improvements lead to stunning results. Let's go! 🌱",
      'Every day you show up, you grow. Show up today.',
      'Growth is silent but powerful. Trust the process.',
      'Water your habits. Watch them bloom. 🌸',
    ]};
  }
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function getHabitNotificationContent(habit: Habit): NotificationContent {
  const nameLower = habit.name.toLowerCase();
  const emoji = habit.emoji;
  const name = habit.name.trim();
  const streak = habit.streak ?? 0;

  const template = getTemplate(emoji, nameLower);

  let title: string;
  let body: string;

  if (template) {
    title = template.title;
    // Personalise: prefix body with habit name, append streak milestone
    const baseBody = pickBody(template.bodies, habit.id);
    body = `${name}: ${baseBody}\n${streakSuffix(streak)}`;
  } else {
    // Fallback always includes the habit name — never a fully generic message
    title = `🔔 ${name}`;
    body = `Time for your "${name}" habit.\n${streakSuffix(streak)}`;
  }

  return {
    title: sanitizeContent(title, `🔔 ${name}`),
    body: sanitizeContent(body, `Complete your "${name}" habit now and keep your streak alive!`),
  };
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
    const title = customContent.title;
    const body = customContent.body;
    const sound = 'default';

    const content: any = {
      title,
      body,
      sound,
      priority: 'high',
      channelId: CHANNEL_ID,
      android: {
        channelId: CHANNEL_ID,
      },
      data: {
        url: `/habit/${habit.id}`,
        screen: '/habit',
        habitId: habit.id,
      },
    };

    if (habit.frequency.kind === 'daily') {
      const trigger: any = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: habit.frequency.hour,
        minute: habit.frequency.minute,
        repeats: true,
        channelId: CHANNEL_ID,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });
      ids.push(notificationId);
    } else {
      for (const weekday of habit.frequency.weekdays) {
        const trigger: any = {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: weekday + 1,
          hour: habit.frequency.hour,
          minute: habit.frequency.minute,
          repeats: true,
          channelId: CHANNEL_ID,
        };

        const notificationId = await Notifications.scheduleNotificationAsync({
          content,
          trigger,
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
