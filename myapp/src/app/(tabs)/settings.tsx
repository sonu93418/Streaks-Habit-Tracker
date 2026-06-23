import * as Clipboard from 'expo-clipboard';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Border, BottomTabInset, NB, Shadow, Spacing, Typography } from '@/constants/theme';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme, useThemeContext } from '@/hooks/useTheme';
import { Pressable3D } from '@/components/pressable-3d';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, theme }: { label: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
      {label.toUpperCase()}
    </Text>
  );
}

function StatusBadge({ status, theme }: { status: string | null; theme: ReturnType<typeof useTheme> }) {
  const bg =
    status === 'granted' ? NB.green
    : status === 'denied'  ? NB.coral
    : NB.yellow;
  const label =
    status === 'granted' ? '✓ Granted'
    : status === 'denied'  ? '✗ Blocked'
    : '? Undetermined';
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: theme.border }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { themeMode, setThemeMode } = useThemeContext();
  
  const {
    permissionStatus,
    requestPermission,
    openSettings,
    remindersEnabled,
    isTogglingReminders,
    toggleReminders,
    triggerTestNotification,
  } = useNotifications();

  // Custom Habit Preferences State
  const [defaultTime, setDefaultTime] = useState({ hour: 8, minute: 0 });
  const [weekStart, setWeekStart] = useState<'Sunday' | 'Monday'>('Sunday');
  const [isTesting, setIsTesting] = useState(false);

  // Load preferences from AsyncStorage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const timeVal = await AsyncStorage.getItem('streaks_default_reminder_time_v1');
        if (timeVal) {
          const [h, m] = timeVal.split(':').map(Number);
          setDefaultTime({ hour: h, minute: m });
        }
        const weekVal = await AsyncStorage.getItem('streaks_week_start_v1');
        if (weekVal === 'Sunday' || weekVal === 'Monday') {
          setWeekStart(weekVal);
        }
      } catch (e) {
        console.warn('Failed to load preferences:', e);
      }
    };
    loadPreferences();
  }, []);

  const handleSaveDefaultTime = async (hour: number, minute: number) => {
    try {
      const timeStr = `${hour}:${minute}`;
      setDefaultTime({ hour, minute });
      await AsyncStorage.setItem('streaks_default_reminder_time_v1', timeStr);
    } catch (e) {
      console.warn('Failed to save default time:', e);
    }
  };

  const handleSaveWeekStart = async (start: 'Sunday' | 'Monday') => {
    try {
      setWeekStart(start);
      await AsyncStorage.setItem('streaks_week_start_v1', start);
    } catch (e) {
      console.warn('Failed to save week start preference:', e);
    }
  };

  // Helper selectors
  const cycleHour = () => {
    const nextHour = (defaultTime.hour + 1) % 24;
    handleSaveDefaultTime(nextHour, defaultTime.minute);
  };

  const cycleMinute = () => {
    const nextMinute = (defaultTime.minute + 15) % 60;
    handleSaveDefaultTime(defaultTime.hour, nextMinute);
  };

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatTime = (h: number, m: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${pad(displayHour)}:${pad(m)} ${ampm}`;
  };

  // Test Notification triggers with clean pop message show
  const handleTrigger5sTest = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert(
        'Permission Required 🔕',
        'System notifications are currently disabled. Enable permissions to verify alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Request Permission', onPress: requestPermission },
          { text: 'Open Settings', onPress: openSettings },
        ]
      );
      return;
    }

    setIsTesting(true);
    try {
      await triggerTestNotification(5);
      Alert.alert(
        'Reminder Scheduled! 🔔',
        'A local test notification has been successfully scheduled. It will fire in 5 seconds. Go to your home screen or lock your device to view the banner alert.',
        [{ text: 'Got it' }]
      );
    } catch (err) {
      Alert.alert('Scheduling Error', 'Failed to schedule local test notification.');
    } finally {
      setIsTesting(false);
    }
  };

  // About popups
  const handleShowPrivacy = () => {
    Alert.alert(
      'Privacy Policy 🔒',
      'Streaks Habit Tracker prioritizes your privacy. All your habits, schedules, streaks, and completions are stored locally on your device via secure system storage. We do not run any remote databases or analytics tracking, and collect zero personal data. Your progress remains entirely yours.',
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const handleShowTerms = () => {
    Alert.alert(
      'Terms of Service 📜',
      'By using Streaks, you agree to track your habits and stay consistent! This application is provided as-is, locally on your device. We are not liable for any streaks you forget to log. Stay consistent and build a better routine!',
      [{ text: 'Accept', style: 'default' }]
    );
  };

  const handleShowSupport = () => {
    Alert.alert(
      'Contact Support 📧',
      'Need help or want to suggest new features? We would love to hear from you!\n\nEmail: support@streaksapp.dev\nWebsite: www.streaksapp.dev',
      [
        {
          text: 'Copy Email',
          onPress: async () => {
            await Clipboard.setStringAsync('support@streaksapp.dev');
            Alert.alert('Copied!', 'Support email address copied to clipboard.');
          },
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Page Title */}
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

          {/* ══ APPEARANCE ══════════════════════════════════════════════════ */}
          <SectionHeader label="Appearance" theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: Border.width, ...Shadow.small }]}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>App Theme</Text>
            <Text style={[styles.cardSubText, { color: theme.textSecondary }]}>
              Customize the appearance of the interface.
            </Text>
            <View style={styles.themeSelectorRow}>
              {(['light', 'dark', 'system'] as const).map((mode) => {
                const active = themeMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setThemeMode(mode)}
                    style={[
                      styles.themeBtn,
                      {
                        backgroundColor: active ? NB.yellow : theme.backgroundSelected,
                        borderColor: active ? NB.black : theme.border,
                        borderWidth: active ? 2.5 : 1.5,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.themeBtnText,
                        {
                          color: active ? NB.black : theme.text,
                          fontFamily: active ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                        },
                      ]}
                    >
                      {mode === 'light' ? '🌞 Light' : mode === 'dark' ? '🌙 Dark' : '⚙️ System'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ══ NOTIFICATIONS ═══════════════════════════════════════════════ */}
          <SectionHeader label="Notifications" theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: Border.width, ...Shadow.small }]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Permission Status</Text>
                <Text style={[styles.cardSubText, { color: theme.textSecondary }]}>
                  Allows local reminders to fire
                </Text>
              </View>
              <StatusBadge status={permissionStatus} theme={theme} />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Local Reminders</Text>
                <Text style={[styles.cardSubText, { color: theme.textSecondary, marginBottom: 0 }]}>
                  Receive notifications for habits
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleReminders()}
                disabled={isTogglingReminders}
                style={[
                  styles.toggleSwitch,
                  {
                    backgroundColor: remindersEnabled ? NB.green : theme.backgroundSelected,
                    borderColor: theme.border,
                    borderWidth: 2,
                  },
                ]}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    {
                      alignSelf: remindersEnabled ? 'flex-end' : 'flex-start',
                      backgroundColor: theme.text,
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>

            {permissionStatus === 'denied' && (
              <Pressable3D
                onPress={openSettings}
                style={styles.cardBtnContainer}
                contentStyle={[styles.cardBtn, { backgroundColor: NB.coral }]}
                shadowDepth={4}
              >
                <Text style={styles.cardBtnText}>→ Open System Settings</Text>
              </Pressable3D>
            )}

            {permissionStatus === 'undetermined' && (
              <Pressable3D
                onPress={requestPermission}
                style={styles.cardBtnContainer}
                contentStyle={[styles.cardBtn, { backgroundColor: NB.yellow }]}
                shadowDepth={4}
              >
                <Text style={styles.cardBtnText}>→ Request Notification Permission</Text>
              </Pressable3D>
            )}

            {permissionStatus === 'granted' && remindersEnabled && (
              <>
                <View style={styles.divider} />
                <Pressable3D
                  onPress={handleTrigger5sTest}
                  disabled={isTesting}
                  style={styles.cardBtnContainer}
                  contentStyle={[styles.cardBtn, { backgroundColor: NB.yellow }]}
                  shadowDepth={4}
                >
                  <Text style={styles.cardBtnText}>
                    {isTesting ? 'Scheduling...' : '🔔 Send Test Notification (5s)'}
                  </Text>
                </Pressable3D>
              </>
            )}

            <View style={styles.divider} />
            <Text style={[styles.cardSubText, { color: theme.textSecondary, marginTop: 4, fontStyle: 'italic' }]}>
              {permissionStatus === 'granted' && remindersEnabled
                ? '🔔 Local reminders are active. You will receive notifications at each habit\'s scheduled time.'
                : '🔕 Local reminders are currently inactive. You will not receive any habit alerts.'}
            </Text>
          </View>

          {/* ══ HABIT PREFERENCES ═══════════════════════════════════════════ */}
          <SectionHeader label="Habit Preferences" theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: Border.width, ...Shadow.small }]}>
            
            {/* Default Reminder Time picker row */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Default Reminder Time</Text>
                <Text style={[styles.cardSubText, { color: theme.textSecondary, marginBottom: 0 }]}>
                  Automatically preset time for new habits
                </Text>
              </View>
              <Text style={[styles.timeDisplayVal, { color: theme.text }]}>
                {formatTime(defaultTime.hour, defaultTime.minute)}
              </Text>
            </View>

            {/* Custom Interactive Time Cylers */}
            <View style={styles.timeCycleRow}>
              <TouchableOpacity onPress={cycleHour} style={[styles.timeCycleBtn, { borderColor: theme.border, backgroundColor: theme.backgroundSelected }]}>
                <Text style={[styles.timeCycleText, { color: theme.text }]}>Hour: {pad(defaultTime.hour)}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={cycleMinute} style={[styles.timeCycleBtn, { borderColor: theme.border, backgroundColor: theme.backgroundSelected }]}>
                <Text style={[styles.timeCycleText, { color: theme.text }]}>Minute: {pad(defaultTime.minute)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Week Start Preference */}
            <Text style={[styles.rowLabel, { color: theme.text, marginBottom: 4 }]}>Week Start Day</Text>
            <View style={styles.themeSelectorRow}>
              {(['Sunday', 'Monday'] as const).map((day) => {
                const active = weekStart === day;
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => handleSaveWeekStart(day)}
                    style={[
                      styles.themeBtn,
                      {
                        backgroundColor: active ? NB.yellow : theme.backgroundSelected,
                        borderColor: active ? NB.black : theme.border,
                        borderWidth: active ? 2.5 : 1.5,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.themeBtnText,
                        {
                          color: active ? NB.black : theme.text,
                          fontFamily: active ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ══ ABOUT ═══════════════════════════════════════════════════════ */}
          <SectionHeader label="About" theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: Border.width, ...Shadow.small }]}>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>App Version</Text>
              <Text style={[styles.versionVal, { color: theme.textSecondary }]}>1.0.0 (build 1)</Text>
            </View>

            <View style={styles.divider} />

            {/* Privacy Row */}
            <TouchableOpacity onPress={handleShowPrivacy} style={styles.aboutLinkRow}>
              <Text style={[styles.aboutLinkText, { color: theme.text }]}>🔒 Privacy Policy</Text>
              <Text style={[styles.aboutArrow, { color: theme.textSecondary }]}>→</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Terms Row */}
            <TouchableOpacity onPress={handleShowTerms} style={styles.aboutLinkRow}>
              <Text style={[styles.aboutLinkText, { color: theme.text }]}>📜 Terms of Service</Text>
              <Text style={[styles.aboutArrow, { color: theme.textSecondary }]}>→</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Support Row */}
            <TouchableOpacity onPress={handleShowSupport} style={styles.aboutLinkRow}>
              <Text style={[styles.aboutLinkText, { color: theme.text }]}>📧 Contact Support</Text>
              <Text style={[styles.aboutArrow, { color: theme.textSecondary }]}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: BottomTabInset }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 45 },
  title: {
    ...Typography.screenTitle,
    marginTop: 8,
    marginBottom: 20,
  },
  sectionHeader: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 20,
  },
  card: {
    borderRadius: Border.radiusLg,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardSubText: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    ...Typography.body,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  badge: {
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: NB.black,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 4,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Border.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnText: {
    fontSize: 13,
  },
  toggleSwitch: {
    width: 60,
    height: 34,
    borderRadius: 17,
    padding: 3,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  cardBtnContainer: {
    width: '100%',
    height: 48,
    marginTop: 4,
  },
  cardBtn: {
    height: 48,
    borderWidth: 2.5,
    borderColor: NB.black,
    borderRadius: Border.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBtnText: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: NB.black,
  },
  timeDisplayVal: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: -0.2,
  },
  timeCycleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  timeCycleBtn: {
    flex: 1,
    height: 42,
    borderWidth: 1.5,
    borderRadius: Border.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeCycleText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  versionVal: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  aboutLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  aboutLinkText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  aboutArrow: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
});
