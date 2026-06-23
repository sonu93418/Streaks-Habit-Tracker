import { Platform, Linking } from 'react-native';
import type { PermissionStatus } from 'expo-notifications';
import Constants from 'expo-constants';

function N() {
  if (Constants.appOwnership === 'expo') {
    return null;
  }
  return require('expo-notifications') as typeof import('expo-notifications');
}

/** Returns the current notification permission status without prompting. */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  try {
    const Notifications = N();
    if (!Notifications) return 'undetermined' as PermissionStatus;
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    console.warn('[permissions] getPermissionStatus error:', error);
    return 'undetermined' as PermissionStatus;
  }
}

/**
 * Requests notification permission if not already granted.
 * Returns the final status — never throws.
 */
export async function requestPermission(): Promise<PermissionStatus> {
  try {
    const Notifications = N();
    if (!Notifications) return 'undetermined' as PermissionStatus;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return existing;
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  } catch (error) {
    console.warn('[permissions] requestPermission error:', error);
    return 'undetermined' as PermissionStatus;
  }
}

/** Opens the system settings page for the app to allow the user to manually enable permissions. */
export async function openSettings(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  } catch (error) {
    console.warn('[permissions] openSettings error:', error);
  }
}
