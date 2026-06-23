import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabits } from '@/hooks/useHabits';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { ThreeDIcon, IconType } from '@/components/three-d-icon';
import { Pressable3D } from '@/components/pressable-3d';
import { Border, BottomTabInset, NB, Shadow, Spacing, Typography } from '@/constants/theme';
import { frequencySummary } from '@/lib/habits/types';
import { PermissionBanner } from '@/components/permission-banner';

function getIconNameOrEmoji(emoji: string): IconType {
  switch (emoji) {
    case '💧': return 'water';
    case '🏋️': return 'workout';
    case '📚': return 'read';
    case '☕': return 'coffee';
    case '🎯': return 'focus';
    case '🌙': return 'sleep';
    default: return emoji as IconType;
  }
}

export default function AlertsScreen() {
  const theme = useTheme();
  const { habits } = useHabits();
  const { permissionStatus, requestPermission, openSettings } = useNotifications();
  const [isTesting, setIsTesting] = useState(false);

  const handleTriggerTest = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert('Permission Required', 'Please enable notification permissions to test alerts.');
      return;
    }

    setIsTesting(true);
    try {
      // Dynamic import to prevent crash on web platforms without notification access
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Notifications = require('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Keep the chain alive!',
          body: 'This is a test notification from Streaks Habit Tracker.',
          sound: 'default',
          data: {
            url: '/',
            test: true,
          },
        },
        trigger: {
          seconds: 3,
        },
      });

      Alert.alert('Success!', 'Test notification scheduled in 3 seconds. Lock your screen or go to home to see it.');
    } catch (err) {
      console.warn('Failed to schedule test notification:', err);
      Alert.alert('Error', 'Failed to schedule test alert.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          {/* Header */}
          <Text style={[styles.title, { color: theme.text }]}>Alerts</Text>

          {/* Permission Banner */}
          {permissionStatus !== 'granted' && (
            <PermissionBanner
              status={permissionStatus as 'denied' | 'undetermined' | null}
              onRequest={requestPermission}
              onOpenSettings={openSettings}
            />
          )}

          {/* Test Trigger Section */}
          <View style={[styles.card, { backgroundColor: NB.cream, borderColor: NB.black, borderWidth: Border.width, ...Shadow.medium }]}>
            <View style={styles.cardHeader}>
              <View style={styles.bellWrapper}>
                <ThreeDIcon name="notifications" size={24} shadowDepth={2} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.cardTitle}>Test Reminders</Text>
                <Text style={[styles.cardText, { color: theme.textSecondary }]}>
                  Schedule a dummy notification to check system banner alerts.
                </Text>
              </View>
            </View>

            <Pressable3D
              onPress={handleTriggerTest}
              disabled={isTesting}
              style={styles.testBtnContainer}
              contentStyle={[styles.testBtn, { backgroundColor: NB.yellow }]}
              shadowDepth={4}
            >
              <Text style={styles.testBtnText}>
                {isTesting ? 'Scheduling...' : '🔔 Trigger Test Alert (3s)'}
              </Text>
            </Pressable3D>
          </View>

          {/* Scheduled Times List */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            SCHEDULED REMINDERS
          </Text>

          {habits.length === 0 ? (
            <View style={[styles.emptyCard, { borderColor: theme.border, borderWidth: Border.width }]}>
              <Text style={styles.emptyTextEmoji}>📭</Text>
              <Text style={[styles.emptyTextTitle, { color: theme.text }]}>No Scheduled Reminders</Text>
              <Text style={[styles.emptyTextSub, { color: theme.textSecondary }]}>
                Add a habit and pick a time. Scheduled alarms will show up here.
              </Text>
            </View>
          ) : (
            habits.map((habit) => (
              <View
                key={habit.id}
                style={[
                  styles.reminderRow,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    borderWidth: Border.width,
                    ...Shadow.small,
                  },
                ]}
              >
                <ThreeDIcon name={getIconNameOrEmoji(habit.emoji)} size={24} shadowDepth={2} />
                <View style={styles.reminderInfo}>
                  <Text style={[styles.reminderName, { color: theme.text }]} numberOfLines={1}>
                    {habit.name}
                  </Text>
                  <Text style={[styles.reminderTime, { color: theme.textSecondary }]}>
                    ⏰ {frequencySummary(habit.frequency)}
                  </Text>
                </View>
                <View style={[styles.activeBadge, { backgroundColor: NB.green, borderColor: NB.black }]}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              </View>
            ))
          )}

          <View style={{ height: BottomTabInset + Spacing.four }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  title: {
    ...Typography.screenTitle,
    marginTop: 8,
    marginBottom: 20,
  },
  sectionLabel: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 24,
  },
  card: {
    borderRadius: Border.radiusLg,
    padding: 16,
    gap: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bellWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...Typography.cardTitle,
    color: '#000000',
  },
  cardText: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 18,
  },
  testBtnContainer: {
    width: '100%',
    height: 50,
  },
  testBtn: {
    height: 50,
    borderWidth: Border.width,
    borderColor: '#000000',
    borderRadius: Border.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnText: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#000000',
  },
  emptyCard: {
    borderRadius: Border.radiusLg,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  emptyTextEmoji: {
    fontSize: 40,
  },
  emptyTextTitle: {
    ...Typography.body,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  emptyTextSub: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Border.radiusLg,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  reminderInfo: {
    flex: 1,
    gap: 2,
  },
  reminderName: {
    ...Typography.body,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  reminderTime: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  activeBadge: {
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeBadgeText: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#000000',
  },
});
