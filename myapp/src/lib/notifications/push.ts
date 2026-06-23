/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * src/lib/notifications/push.ts
 *
 * WHY THIS ERROR OCCURS (Expo SDK 53+):
 * ─────────────────────────────────────
 * Before SDK 53, Expo Go included a shared push credential that let any app
 * inside Expo Go receive push notifications. Starting with SDK 53, Expo
 * removed this shared credential from Expo Go entirely.
 *
 * Consequence:
 *   - Calling `Notifications.getExpoPushTokenAsync()` inside Expo Go now
 *     throws: "Functionality provided by expo-notifications was removed from
 *     Expo Go with the release of SDK 53."
 *   - LOCAL notifications (scheduling, cancelling, foreground handlers)
 *     still work fine in Expo Go — only push token registration is broken.
 *   - Push notifications require an EAS Development Build or a standalone
 *     app that is signed with your own APNs / FCM credentials.
 *
 * This module guards every push-only path with an `isExpoGo()` check and
 * returns null instead of throwing, so the rest of the app stays stable.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const TOKEN_STORAGE_KEY = 'expo_push_token_v1';

// ─── Environment detection ─────────────────────────────────────────────────────

/**
 * Returns true when the app is running inside Expo Go.
 *
 * WHY string comparison instead of AppOwnership enum:
 * `AppOwnership` as a named import from expo-constants may not be
 * available in all SDK 55 build variants. Using the string 'expo' is
 * always safe and never causes a module-load error.
 */
export function isRunningInExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/** Lazy accessor — never called at module level, only inside function bodies. */
function N() {
  if (Constants.appOwnership === 'expo') {
    return null;
  }
  return require('expo-notifications') as typeof import('expo-notifications');
}

// ─── Push registration ─────────────────────────────────────────────────────────

export type PushRegistrationResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'expo-go' | 'not-device' | 'permission-denied' | 'no-project-id' | 'error'; message: string };

/**
 * Attempts to register the device for Expo push notifications.
 *
 * Returns a discriminated union:
 *   { ok: true,  token }    — registration succeeded
 *   { ok: false, reason }   — registration skipped or failed (no crash)
 *
 * Safe to call multiple times — returns the cached token when available.
 */
export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  // ── Guard 1: Expo Go ──────────────────────────────────────────────────────
  if (isRunningInExpoGo()) {
    return {
      ok: false,
      reason: 'expo-go',
      message:
        'Push notifications are not supported in Expo Go (SDK 53+). ' +
        'Please use an EAS Development Build:\n' +
        'eas build --profile development --platform android',
    };
  }

  // ── Guard 2: Physical device ──────────────────────────────────────────────
  if (!Device.isDevice) {
    return {
      ok: false,
      reason: 'not-device',
      message: 'Push notifications require a physical device (not an emulator).',
    };
  }

  // ── Guard 3: Permission ───────────────────────────────────────────────────
  try {
    const Notifications = N();
    if (!Notifications) {
      return {
        ok: false,
        reason: 'expo-go',
        message: 'Notifications module not available in this environment.',
      };
    }
    let { status } = await Notifications.getPermissionsAsync();

    if (status !== 'granted') {
      // On Android 13+ we must explicitly request POST_NOTIFICATIONS
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        const result = await Notifications.requestPermissionsAsync();
        status = result.status;
      }
    }

    if (status !== 'granted') {
      return {
        ok: false,
        reason: 'permission-denied',
        message: 'Notification permission was denied. Open Settings to enable it.',
      };
    }

    // ── Guard 4: EAS project ID ──────────────────────────────────────────────
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      return {
        ok: false,
        reason: 'no-project-id',
        message:
          'No EAS project ID found. Run `eas init` and add the projectId to app.json.',
      };
    }

    // ── Fetch token ──────────────────────────────────────────────────────────
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    // Persist so Settings can show it without re-fetching on every mount
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);

    return { ok: true, token };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[push] Failed to register:', message);
    return { ok: false, reason: 'error', message };
  }
}

// ─── Token persistence helpers ─────────────────────────────────────────────────

/** Returns the last successfully registered token, or null if none. */
export async function getSavedPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Clears the stored token (e.g. on logout / token invalidation). */
export async function clearPushToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Silently ignore storage errors
  }
}
