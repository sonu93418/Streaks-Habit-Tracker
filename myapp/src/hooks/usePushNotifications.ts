import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { PermissionStatus } from 'expo-notifications';

import { getPermissionStatus } from '@/lib/notifications/permissions';
import {
  isRunningInExpoGo,
  registerForPushNotifications,
  getSavedPushToken,
  clearPushToken,
} from '@/lib/notifications/push';

export type UsePushNotificationsResult = {
  expoPushToken: string | null;
  permissionStatus: PermissionStatus | null;
  isSupported: boolean;
  isLoading: boolean;
  failureReason: string | null;
  register: () => Promise<void>;
};

export function usePushNotifications(): UsePushNotificationsResult {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [failureReason, setFailureReason] = useState<string | null>(null);

  const isSupported = !isRunningInExpoGo();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const register = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    setFailureReason(null);

    // Refresh permission status
    try {
      const status = await getPermissionStatus();
      if (mountedRef.current) setPermissionStatus(status);
    } catch {
      // Non-fatal
    }

    if (!isSupported) {
      if (mountedRef.current) {
        setExpoPushToken(null);
        setFailureReason(
          'Push notifications require an EAS Development Build.\n' +
          'Expo Go no longer includes push credentials.'
        );
        setIsLoading(false);
      }
      return;
    }

    const cached = await getSavedPushToken();
    if (cached && mountedRef.current) {
      setExpoPushToken(cached);
      setIsLoading(false);
      return;
    }

    const result = await registerForPushNotifications();
    if (!mountedRef.current) return;

    if (result.ok) {
      setExpoPushToken(result.token);
      setFailureReason(null);
    } else {
      setExpoPushToken(null);
      setFailureReason(result.message);
      await clearPushToken().catch(() => undefined);
    }

    setIsLoading(false);
  }, [isSupported]);

  // Register push on mount
  useEffect(() => {
    register();
  }, [register]);

  // ── AppState Listener for Permission Updates ──
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        try {
          const status = await getPermissionStatus();
          if (mountedRef.current) {
            setPermissionStatus(status);
            // If permission was granted, retry registration
            if (status === 'granted' && isSupported && !expoPushToken) {
              register();
            }
          }
        } catch {
          // ignore
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove?.();
    };
  }, [register, isSupported, expoPushToken]);

  return {
    expoPushToken,
    permissionStatus,
    isSupported,
    isLoading,
    failureReason,
    register,
  };
}
