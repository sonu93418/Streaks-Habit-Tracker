import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmojiPicker } from '@/components/emoji-picker';
import { FrequencyPicker } from '@/components/frequency-picker';
import { Border, BottomTabInset, NB, Shadow, Spacing, Typography } from '@/constants/theme';
import { useHabits } from '@/hooks/useHabits';
import { useTheme } from '@/hooks/useTheme';
import { Frequency } from '@/lib/habits/types';

const DEFAULT_FREQUENCY: Frequency = { kind: 'daily', hour: 8, minute: 0 };
const DEFAULT_EMOJI = '💧';

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function NewHabitScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { editId: editIdParam } = useLocalSearchParams<{ editId?: string | string[] }>();
  const editId = getParam(editIdParam);
  const { habits, isLoading, createHabit, editHabit } = useHabits();

  const existingHabit = useMemo(
    () => (editId ? habits.find((habit) => habit.id === editId) ?? null : null),
    [editId, habits]
  );
  const isEditing = Boolean(editId);
  const editHabitMissing = isEditing && !isLoading && existingHabit === null;

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(DEFAULT_EMOJI);
  const [frequency, setFrequency] = useState<Frequency>(DEFAULT_FREQUENCY);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!existingHabit) return;
    setName(existingHabit.name);
    setEmoji(existingHabit.emoji);
    setFrequency(existingHabit.frequency);
  }, [existingHabit]);

  const validate = (): boolean => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a habit name.');
      return false;
    }
    if (trimmedName.length > 40) {
      Alert.alert('Name too long', 'Habit names must be 40 characters or less.');
      return false;
    }
    if (frequency.kind === 'weekly' && frequency.weekdays.length === 0) {
      Alert.alert('Select days', 'Please select at least one weekday.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (isSaving || !validate()) return;

    setIsSaving(true);
    try {
      const formData = { name: name.trim(), emoji, frequency };
      if (isEditing) {
        if (!editId) throw new Error('Missing edit id.');
        await editHabit(editId, formData);
      } else {
        await createHabit(formData);
      }
      router.replace('/(tabs)/' as any);
    } catch (error) {
      console.warn('[new] Failed to save habit:', error);
      Alert.alert('Could not save habit', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (editHabitMissing) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.missingState}>
            <Text style={styles.missingEmoji}>🔍</Text>
            <Text style={[styles.missingTitle, { color: theme.text }]}>
              Habit not found
            </Text>
            <Text style={[styles.missingText, { color: theme.textSecondary }]}>
              This habit may have been deleted.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/' as any)}
              style={[styles.saveBtn, { backgroundColor: NB.yellow, borderColor: NB.black }]}
            >
              <Text style={styles.saveBtnText}>Back Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.backBtnText, { color: theme.text }]}>×</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isEditing ? 'Edit Habit' : 'New Habit'}
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View
            style={[
              styles.preview,
              {
                backgroundColor: NB.yellow,
                borderColor: NB.black,
                ...Shadow.large,
                shadowColor: NB.black,
              },
            ]}
          >
            <Text style={styles.previewEmoji}>{emoji}</Text>
            <Text style={styles.previewName} numberOfLines={1}>
              {name.trim() || 'Your Habit Name'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              NAME
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                  ...Shadow.small,
                  shadowColor: theme.shadow,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Drink Water, Read, Workout..."
                placeholderTextColor={theme.textSecondary}
                maxLength={40}
                returnKeyType="done"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.section}>
            <EmojiPicker selected={emoji} onSelect={setEmoji} />
          </View>

          <View style={styles.section}>
            <FrequencyPicker frequency={frequency} onChange={setFrequency} />
          </View>

          <View
            style={[
              styles.noticeBox,
              { borderColor: theme.border, backgroundColor: theme.backgroundElement },
            ]}
          >
            <Text style={styles.noticeIcon}>🔔</Text>
            <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
              {isEditing
                ? 'Existing reminders will be cancelled and rescheduled after saving.'
                : 'Reminders are scheduled after the habit is saved. Permission denial will not block saving.'}
            </Text>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={isSaving || (isEditing && isLoading)}
            style={({ pressed }: { pressed: boolean }) => [
              styles.saveBtn,
              {
                backgroundColor: isSaving ? theme.card : NB.yellow,
                borderColor: NB.black,
                ...Shadow.large,
                shadowColor: NB.black,
                opacity: isSaving ? 0.7 : 1,
                transform: [{ translateX: pressed ? 3 : 0 }, { translateY: pressed ? 3 : 0 }],
              },
            ]}
          >
            <Text style={styles.saveBtnText}>
              {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : '+ Create Habit'}
            </Text>
          </Pressable>

          <View style={{ height: BottomTabInset + Spacing.four }} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 26,
    lineHeight: 28,
  },
  headerTitle: {
    ...Typography.cardTitle,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 20,
  },
  preview: {
    borderWidth: 3,
    borderRadius: Border.radiusLg,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  previewEmoji: { fontSize: 56 },
  previewName: {
    ...Typography.sectionHeading,
    color: NB.black,
    textAlign: 'center',
  },
  section: {
    gap: 0,
  },
  sectionLabel: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 2.5,
    borderRadius: Border.radius,
  },
  input: {
    ...Typography.body,
    fontFamily: 'PlusJakartaSans_500Medium',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  noticeBox: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 2,
    borderRadius: Border.radiusSm,
    padding: 12,
    alignItems: 'flex-start',
  },
  noticeIcon: { fontSize: 18 },
  noticeText: {
    flex: 1,
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 18,
  },
  saveBtn: {
    borderWidth: 3,
    borderRadius: Border.radius,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveBtnText: {
    ...Typography.button,
    color: NB.black,
  },
  missingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  missingEmoji: { fontSize: 48 },
  missingTitle: {
    ...Typography.sectionHeading,
  },
  missingText: {
    ...Typography.body,
    textAlign: 'center',
  },
});
