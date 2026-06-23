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

const CATEGORIES = [
  { name: 'Health', emoji: '🍎', color: '#4ADE80' },
  { name: 'Fitness', emoji: '🏋️', color: '#FF6B6B' },
  { name: 'Study', emoji: '📚', color: '#BE4BDB' },
  { name: 'Productivity', emoji: '🎯', color: '#FFD400' },
  { name: 'Sleep', emoji: '🌙', color: '#60A5FA' },
  { name: 'Custom', emoji: '✨', color: '#FAF2DC' },
];

const COLORS = [
  { label: 'Yellow', value: '#FFD400' },
  { label: 'Coral', value: '#FF6B6B' },
  { label: 'Green', value: '#4ADE80' },
  { label: 'Lilac', value: '#BE4BDB' },
  { label: 'Blue', value: '#60A5FA' },
  { label: 'Cream', value: '#FAF2DC' },
];

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
  const [category, setCategory] = useState('Custom');
  const [color, setColor] = useState('#FFD400');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!existingHabit) return;
    setName(existingHabit.name);
    setEmoji(existingHabit.emoji);
    setFrequency(existingHabit.frequency);
    if (existingHabit.category) setCategory(existingHabit.category);
    if (existingHabit.color) setColor(existingHabit.color);
  }, [existingHabit]);

  const handleSelectCategory = (cat: typeof CATEGORIES[number]) => {
    setCategory(cat.name);
    setEmoji(cat.emoji);
    setColor(cat.color);
  };

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
      const formData = { name: name.trim(), emoji, frequency, category, color };
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

  const isNameEmpty = !name.trim();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
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

        {/* Scrollable Form Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Accent Color Themed Preview */}
          <View
            style={[
              styles.preview,
              {
                backgroundColor: color,
                borderColor: NB.black,
                borderWidth: Border.width,
                ...Shadow.medium,
                shadowColor: NB.black,
              },
            ]}
          >
            <Text style={styles.previewEmoji}>{emoji}</Text>
            <Text style={styles.previewName} numberOfLines={1}>
              {name.trim() || 'Your Habit Name'}
            </Text>
            {category !== 'Custom' && (
              <View style={styles.previewCategory}>
                <Text style={styles.previewCategoryText}>{category.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* Name Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              HABIT NAME
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
                placeholder="e.g. Drink Water"
                placeholderTextColor={theme.textSecondary}
                maxLength={40}
                returnKeyType="done"
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Category Chips */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              CATEGORY
            </Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    onPress={() => handleSelectCategory(cat)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? cat.color : theme.card,
                        borderColor: isSelected ? NB.black : theme.border,
                        borderWidth: isSelected ? 2.5 : 1.5,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryChipEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryChipText,
                        {
                          color: isSelected ? NB.black : theme.text,
                          fontFamily: isSelected ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                        },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Color Accent Picker */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              CARD ACCENT COLOR
            </Text>
            <View style={styles.colorPickerRow}>
              {COLORS.map((col) => {
                const isSelected = color === col.value;
                return (
                  <TouchableOpacity
                    key={col.value}
                    onPress={() => setColor(col.value)}
                    style={[
                      styles.colorPill,
                      {
                        backgroundColor: col.value,
                        borderColor: isSelected ? NB.black : 'rgba(0,0,0,0.15)',
                        borderWidth: isSelected ? 3.5 : 1.5,
                        transform: [{ scale: isSelected ? 1.15 : 1 }],
                      },
                    ]}
                    activeOpacity={0.7}
                  />
                );
              })}
            </View>
          </View>

          {/* Emoji Picker Component */}
          <View style={styles.section}>
            <EmojiPicker selected={emoji} onSelect={setEmoji} />
          </View>

          {/* Frequency & Time Picker Component */}
          <View style={styles.section}>
            <FrequencyPicker frequency={frequency} onChange={setFrequency} />
          </View>

          {/* Notice box */}
          <View
            style={[
              styles.noticeBox,
              { borderColor: theme.border, backgroundColor: theme.backgroundElement },
            ]}
          >
            <Text style={styles.noticeIcon}>🔔</Text>
            <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
              {isEditing
                ? 'Existing reminders will be rescheduled for the new time.'
                : 'Reminders are scheduled after saving. Local reminder settings can be updated anytime.'}
            </Text>
          </View>

          <View style={{ height: Spacing.four }} />
        </ScrollView>

        {/* Sticky Save Button Footer */}
        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <Pressable
            onPress={handleSave}
            disabled={isSaving || isNameEmpty || (isEditing && isLoading)}
            style={({ pressed }: { pressed: boolean }) => [
              styles.saveBtn,
              {
                backgroundColor: isNameEmpty ? theme.backgroundSelected : color,
                borderColor: isNameEmpty ? theme.border : NB.black,
                opacity: isSaving ? 0.7 : 1,
                transform: [{ translateX: pressed && !isNameEmpty ? 3 : 0 }, { translateY: pressed && !isNameEmpty ? 3 : 0 }],
              },
              !isNameEmpty && {
                ...Shadow.large,
                shadowColor: NB.black,
              },
            ]}
          >
            <Text style={[styles.saveBtnText, { color: isNameEmpty ? theme.textSecondary : NB.black }]}>
              {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : '+ Create Habit'}
            </Text>
          </Pressable>
        </View>
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
    borderRadius: Border.radiusLg,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  previewEmoji: { fontSize: 56 },
  previewName: {
    ...Typography.sectionHeading,
    color: NB.black,
    textAlign: 'center',
  },
  previewCategory: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  previewCategoryText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: NB.black,
    letterSpacing: 0.5,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.2,
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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Border.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipEmoji: {
    fontSize: 15,
  },
  categoryChipText: {
    fontSize: 13,
  },
  colorPickerRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
    paddingVertical: 4,
  },
  colorPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 4 : 12,
    borderTopWidth: 1.5,
  },
  saveBtn: {
    borderWidth: Border.width,
    borderRadius: Border.radius,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    ...Typography.button,
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
