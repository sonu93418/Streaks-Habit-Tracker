import { router } from 'expo-router';

export function routeFromNotificationData(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  if (typeof data.url === 'string' && data.url.startsWith('/')) return data.url;
  if (data.screen === '/habit' && typeof data.habitId === 'string') {
    return `/habit/${data.habitId}`;
  }
  return null;
}

export function handleNotificationTap(data: Record<string, unknown> | undefined): void {
  try {
    const route = routeFromNotificationData(data);
    if (!route) {
      console.log('[deepLink] No valid route found in payload data:', data);
      return;
    }

    // Handle missing or invalid habitId parameter if it is a habit route
    if (route.startsWith('/habit/')) {
      const parts = route.split('/');
      const habitId = parts[parts.length - 1];
      if (!habitId || habitId === 'undefined' || habitId === 'null') {
        console.warn('[deepLink] Notification tapped, but habitId is invalid:', habitId);
        // Fallback to home dashboard screen
        router.push('/' as any);
        return;
      }
    }

    // Push the route
    router.push(route as any);
  } catch (error) {
    console.warn('[deepLink] Failed to navigate from notification:', error);
  }
}
