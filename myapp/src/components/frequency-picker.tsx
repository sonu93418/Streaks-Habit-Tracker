import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Border, NB, Shadow, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Frequency } from '@/lib/habits/types';

const WEEKDAYS = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

type Props = {
  frequency: Frequency;
  onChange: (freq: Frequency) => void;
};

export function FrequencyPicker({ frequency, onChange }: Props) {
  const theme = useTheme();
  const isDaily = frequency.kind === 'daily';

  const toggleKind = (kind: 'daily' | 'weekly') => {
    if (kind === frequency.kind) return;
    if (kind === 'daily') {
      onChange({ kind: 'daily', hour: frequency.hour, minute: frequency.minute });
    } else {
      onChange({ kind: 'weekly', weekdays: [1], hour: frequency.hour, minute: frequency.minute });
    }
  };

  const toggleWeekday = (day: number) => {
    if (frequency.kind !== 'weekly') return;
    const current = frequency.weekdays;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    // Must have at least one day
    if (next.length === 0) return;
    onChange({ ...frequency, weekdays: next });
  };

  const setHour = (hour: number) => onChange({ ...frequency, hour });
  const setMinute = (minute: number) => onChange({ ...frequency, minute });

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={styles.container}>
      {/* Kind toggle */}
      <Text style={[styles.label, { color: theme.textSecondary }]}>FREQUENCY</Text>
      <View style={[styles.toggle, { borderColor: theme.border }]}>
        {(['daily', 'weekly'] as const).map((kind) => {
          const active = frequency.kind === kind;
          return (
            <TouchableOpacity
              key={kind}
              onPress={() => toggleKind(kind)}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: active ? NB.yellow : 'transparent',
                  borderRightWidth: kind === 'daily' ? Border.width : 0,
                  borderColor: theme.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  { color: active ? NB.black : theme.textSecondary },
                ]}
              >
                {kind === 'daily' ? 'Daily' : 'Weekly'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Weekday selector (weekly only) */}
      {!isDaily && (
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day) => {
            const active =
              frequency.kind === 'weekly' &&
              frequency.weekdays.includes(day.value);
            return (
              <TouchableOpacity
                key={day.value}
                onPress={() => toggleWeekday(day.value)}
                style={[
                  styles.dayBtn,
                  {
                    backgroundColor: active ? NB.yellow : theme.card,
                    borderColor: theme.border,
                    ...(active ? Shadow.small : {}),
                    shadowColor: NB.black,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: active ? NB.black : theme.textSecondary },
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Time picker */}
      <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>
        TIME
      </Text>
      <View style={styles.timeRow}>
        {/* Hour scroll */}
        <View style={[styles.timeBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>HR</Text>
          <View style={styles.timeScroll}>
            {HOURS.map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => setHour(h)}
                style={[
                  styles.timeItem,
                  {
                    backgroundColor:
                      frequency.hour === h ? NB.yellow : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timeItemText,
                    {
                      color: frequency.hour === h ? NB.black : theme.text,
                      fontFamily: frequency.hour === h ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                    },
                  ]}
                >
                  {pad(h)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.colon, { color: theme.text }]}>:</Text>

        {/* Minute scroll */}
        <View style={[styles.timeBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>MIN</Text>
          <View style={styles.timeScroll}>
            {MINUTES.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMinute(m)}
                style={[
                  styles.timeItem,
                  {
                    backgroundColor:
                      frequency.minute === m ? NB.yellow : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timeItemText,
                    {
                      color: frequency.minute === m ? NB.black : theme.text,
                      fontFamily: frequency.minute === m ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                    },
                  ]}
                >
                  {pad(m)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Current time summary */}
      <View
        style={[
          styles.timeSummary,
          { backgroundColor: NB.yellow, borderColor: NB.black },
        ]}
      >
        <Text style={styles.timeSummaryText}>
          ⏰ Reminder at {pad(frequency.hour)}:{pad(frequency.minute)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  toggle: {
    flexDirection: 'row',
    borderWidth: Border.width,
    borderRadius: Border.radiusSm,
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleBtnText: {
    ...Typography.body,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    justifyContent: 'center',
  },
  dayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: Border.width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBox: {
    flex: 1,
    borderWidth: Border.width,
    borderRadius: Border.radiusSm,
    padding: 8,
    maxHeight: 180,
  },
  timeLabel: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  timeScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  timeItem: {
    width: 36,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeItemText: {
    ...Typography.caption,
  },
  colon: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 28,
    marginTop: 16,
  },
  timeSummary: {
    borderWidth: Border.width,
    borderRadius: Border.radiusSm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  timeSummaryText: {
    ...Typography.body,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: NB.black,
  },
});
