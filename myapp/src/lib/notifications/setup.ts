/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * src/lib/notifications/setup.ts
 *
 * WHY NO STATIC `import * as Notifications from 'expo-notifications'`:
 * ─────────────────────────────────────────────────────────────────────
 * expo-notifications/build/index.js eagerly imports getExpoPushTokenAsync.js,
 * which eagerly imports DevicePushTokenAutoRegistration.fx.js. That last file
 * runs addPushTokenListener() at MODULE LEVEL (<global> scope). In Expo Go
 * SDK 53+, addPushTokenListener() calls warnOfExpoGoPushUsage() which THROWS
 * (not warns) immediately — crashing the entire app before a single component
 * renders.
 *
 * The fix: use lazy `require('expo-notifications')` INSIDE each function body.
 * The require only executes when the function is called, which is always inside
 * a useEffect (post-mount), never during module evaluation.
 *
 * Local notification APIs (scheduling, foreground handler, tap listener) still
 * work perfectly in Expo Go — only the module-level import is the problem.
 */

import Constants from 'expo-constants';
import type { PermissionStatus } from 'expo-notifications';
import { Platform } from 'react-native';

export const CHANNEL_ID = 'habit-reminders';

/** Returns true if running on Android inside Expo Go. */
export function isAndroidExpoGo(): boolean {
  return Platform.OS === 'android' && Constants.appOwnership === 'expo';
}

/** Lazy accessor — never called at module level, only inside function bodies. */
function N() {
  if (Constants.appOwnership === 'expo') {
    return null;
  }
  return require('expo-notifications') as typeof import('expo-notifications');
}

// ─── Android Channel ──────────────────────────────────────────────────────────

/**
 * Creates a high-importance Android notification channel.
 *
 * WHY BEFORE PERMISSION REQUEST:
 * On Android 8.0+ (API 26), notifications go to channels. The channel carries
 * the importance level (IMPORTANCE_HIGH = heads-up banner + sound). If the
 * channel doesn't exist when the first notification fires, Android silently
 * drops it. Creating the channel before calling requestPermissionsAsync()
 * ensures the user's first notification shows as a full banner.
 */
export async function createAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const Notifications = N();
    if (!Notifications) return;
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFE600',
      sound: 'default',
      description: 'Daily and weekly habit reminder alerts',
    });
  } catch (err) {
    console.warn('[setup] Failed to create Android channel:', err);
  }
}

// ─── Permission helpers (Re-exported from permissions.ts) ───────────────────────────

export { getPermissionStatus, requestPermission, openSettings } from './permissions';

// ─── Foreground handler ───────────────────────────────────────────────────────

/**
 * Registers the foreground notification handler.
 * Without this, notifications fired while the app is open are suppressed.
 * Call once at app startup inside useEffect in _layout.tsx.
 */
export function registerForegroundHandler(): void {
  try {
    const Notifications = N();
    if (!Notifications) return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('[setup] Failed to register foreground handler:', err);
  }
}

// ─── Unified tap handler (local + push) ──────────────────────────────────────

import { handleNotificationTap } from './deepLink';

export function registerTapHandler(): { remove: () => void } {
  try {
    const Notifications = N();
    if (!Notifications) return { remove: () => undefined };
    const navigateFromData = (data: Record<string, unknown> | undefined) => {
      handleNotificationTap(data);
    };

    const lastResponse = Notifications.getLastNotificationResponse?.();
    navigateFromData(
      lastResponse?.notification.request.content.data as Record<string, unknown> | undefined
    );

    return Notifications.addNotificationResponseReceivedListener((response) => {
      navigateFromData(
        response.notification.request.content.data as Record<string, unknown> | undefined
      );
    });
  } catch (err) {
    console.warn('[setup] Failed to register tap handler:', err);
    return { remove: () => undefined };
  }
}
