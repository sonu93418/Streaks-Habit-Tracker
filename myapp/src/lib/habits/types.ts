/**
 * Core data types for the Streaks Habit Tracker.
 */

export type Frequency =
  | { kind: 'daily'; hour: number; minute: number }
  | { kind: 'weekly'; weekdays: number[]; hour: number; minute: number };

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  frequency: Frequency;
  notificationIds: string[];
  streak: number;
  lastCompletedISO: string | null; // ISO date string YYYY-MM-DD
  category?: string;
  color?: string;
};

export type HabitFormData = {
  name: string;
  emoji: string;
  frequency: Frequency;
  category?: string;
  color?: string;
};

/** Returns a YYYY-MM-DD string for a given Date (local time) */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns today's YYYY-MM-DD string */
export function today(): string {
  return toDateString(new Date());
}

/** Returns yesterday's YYYY-MM-DD string */
export function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateString(d);
}

/**
 * Returns whether a habit's frequency includes the given weekday.
 * weekday: 0=Sunday, 1=Monday, …, 6=Saturday
 */
export function habitIsActiveToday(habit: Habit): boolean {
  if (habit.frequency.kind === 'daily') return true;
  const todayWeekday = new Date().getDay(); // 0-6
  return habit.frequency.weekdays.includes(todayWeekday);
}

/** Human-readable frequency summary */
export function frequencySummary(freq: Frequency): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const ampm = freq.hour >= 12 ? 'PM' : 'AM';
  const displayHour = freq.hour % 12 === 0 ? 12 : freq.hour % 12;
  const time = `${pad(displayHour)}:${pad(freq.minute)} ${ampm}`;
  if (freq.kind === 'daily') {
    return `Every day at ${time}`;
  }
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = freq.weekdays.map((d) => DAYS[d]).join(', ');
  return `${days} at ${time}`;
}
