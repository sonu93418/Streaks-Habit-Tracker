import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';

import { Border, NB, Shadow, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Frequency } from '@/lib/habits/types';

const WEEKDAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

type Props = {
  frequency: Frequency;
  onChange: (freq: Frequency) => void;
};

export function FrequencyPicker({ frequency, onChange }: Props) {
  const theme = useTheme();
  const isDaily = frequency.kind === 'daily';
  const [use24Hour, setUse24Hour] = useState(false);

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

  const pad = (n: number) => String(n).padStart(2, '0');

  // Time conversion helpers
  const ampm = frequency.hour >= 12 ? 'PM' : 'AM';
  const hour12 = frequency.hour % 12 === 0 ? 12 : frequency.hour % 12;

  const to24Hour = (h12: number, period: 'AM' | 'PM') => {
    let h24 = h12 % 12;
    if (period === 'PM') {
      h24 += 12;
    }
    return h24;
  };

  const selectHour12 = (h12: number) => {
    const h24 = to24Hour(h12, ampm);
    onChange({ ...frequency, hour: h24 });
  };

  const selectHour24 = (h24: number) => {
    onChange({ ...frequency, hour: h24 });
  };

  const selectPeriod = (period: 'AM' | 'PM') => {
    const h24 = to24Hour(hour12, period);
    onChange({ ...frequency, hour: h24 });
  };

  const selectMinute = (minute: number) => {
    onChange({ ...frequency, minute });
  };

  // Helper label describing triggers
  const getHelperLabel = () => {
    const formatTimeLabel = () => {
      if (use24Hour) {
        return `${pad(frequency.hour)}:${pad(frequency.minute)}`;
      }
      return `${hour12}:${pad(frequency.minute)} ${ampm}`;
    };

    if (frequency.kind === 'daily') {
      return `Reminder will trigger every day at ${formatTimeLabel()}.`;
    }
    const days = frequency.weekdays.map((d) => WEEKDAYS[d].label).join(', ');
    return `Reminder will trigger on ${days} at ${formatTimeLabel()}.`;
  };

  return (
    <View style={styles.container}>
      {/* ── Frequency Mode ── */}
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
                {kind === 'daily' ? 'Daily' : 'Weekly / Custom Days'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Weekday selector (weekly only) ── */}
      {!isDaily && (
        <View style={styles.weekdayWrapper}>
          <Text style={[styles.label, { color: theme.textSecondary, marginTop: 8 }]}>
            SELECT WEEKDAYS
          </Text>
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
        </View>
      )}

      {/* ── Time picker header ── */}
      <View style={styles.timeHeaderRow}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>REMINDER TIME</Text>
        <TouchableOpacity
          onPress={() => setUse24Hour(!use24Hour)}
          style={[
            styles.formatBtn,
            {
              borderColor: theme.border,
              backgroundColor: theme.backgroundSelected,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.formatBtnText, { color: theme.text }]}>
            {use24Hour ? 'Use 12-Hour Format' : 'Use 24-Hour Format'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Time Displays ── */}
      <View
        style={[
          styles.timeDisplayCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderWidth: Border.width,
            ...Shadow.small,
          },
        ]}
      >
        <Text style={[styles.timeDisplayVal, { color: theme.text }]}>
          {use24Hour
            ? `${pad(frequency.hour)}:${pad(frequency.minute)}`
            : `${pad(hour12)}:${pad(frequency.minute)}`}
        </Text>
        {!use24Hour && (
          <View style={styles.ampmSelector}>
            {(['AM', 'PM'] as const).map((period) => {
              const active = ampm === period;
              return (
                <TouchableOpacity
                  key={period}
                  onPress={() => selectPeriod(period)}
                  style={[
                    styles.ampmBtn,
                    {
                      backgroundColor: active ? NB.yellow : 'transparent',
                      borderColor: active ? NB.black : 'transparent',
                      borderWidth: active ? 2 : 0,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.ampmText,
                      {
                        color: active ? NB.black : theme.textSecondary,
                        fontFamily: active ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                      },
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Scrollable hours selector ── */}
      <Text style={[styles.subLabel, { color: theme.textSecondary }]}>Hour</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollSelector}
      >
        {(use24Hour ? Array.from({ length: 24 }, (_, i) => i) : Array.from({ length: 12 }, (_, i) => i + 1)).map((h) => {
          const isSelected = use24Hour ? frequency.hour === h : hour12 === h;
          return (
            <TouchableOpacity
              key={h}
              onPress={() => (use24Hour ? selectHour24(h) : selectHour12(h))}
              style={[
                styles.itemChip,
                {
                  backgroundColor: isSelected ? NB.yellow : theme.card,
                  borderColor: isSelected ? NB.black : theme.border,
                  borderWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.itemChipText,
                  {
                    color: isSelected ? NB.black : theme.text,
                    fontFamily: isSelected ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                  },
                ]}
              >
                {pad(h)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Scrollable minutes selector ── */}
      <Text style={[styles.subLabel, { color: theme.textSecondary }]}>Minute</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollSelector}
      >
        {MINUTES.map((m) => {
          const isSelected = frequency.minute === m;
          return (
            <TouchableOpacity
              key={m}
              onPress={() => selectMinute(m)}
              style={[
                styles.itemChip,
                {
                  backgroundColor: isSelected ? NB.yellow : theme.card,
                  borderColor: isSelected ? NB.black : theme.border,
                  borderWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.itemChipText,
                  {
                    color: isSelected ? NB.black : theme.text,
                    fontFamily: isSelected ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                  },
                ]}
              >
                {pad(m)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Helper Label Summary ── */}
      <View
        style={[
          styles.helperBox,
          { backgroundColor: theme.backgroundSelected, borderColor: theme.border, borderWidth: 2 },
        ]}
      >
        <Text style={[styles.helperText, { color: theme.text }]}>
          💡 {getHelperLabel()}
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
  subLabel: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 2,
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
  weekdayWrapper: {
    marginTop: 4,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    justifyContent: 'center',
  },
  dayBtn: {
    flex: 1,
    height: 40,
    borderRadius: Border.radiusSm,
    borderWidth: Border.width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  timeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  formatBtn: {
    borderWidth: 1.5,
    borderRadius: Border.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  formatBtnText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  timeDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: Border.radiusLg,
    gap: 16,
    marginTop: 4,
  },
  timeDisplayVal: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 48,
    letterSpacing: -1,
  },
  ampmSelector: {
    borderWidth: 2,
    borderRadius: Border.radiusSm,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  ampmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmText: {
    fontSize: 13,
  },
  scrollSelector: {
    paddingVertical: 4,
    gap: 8,
  },
  itemChip: {
    width: 46,
    height: 40,
    borderRadius: Border.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemChipText: {
    fontSize: 14,
  },
  helperBox: {
    borderRadius: Border.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  helperText: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    lineHeight: 18,
  },
});
