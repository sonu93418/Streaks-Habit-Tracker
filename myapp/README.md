# 🔥 Streaks — Habit Tracker

A production-quality React Native habit tracker built with **Expo SDK 55** and a **Neo-Brutalism** design system.

---

## Features

- ✅ Create, edit, and delete habits (name, emoji, reminder time, frequency)
- 🔔 Local notifications — daily and weekly schedules
- 🔁 Streaks — tracks consecutive completion days
- 📱 Push notification support via Expo Push Notifications
- 🔗 Deep linking from both local and push notifications → habit detail screen
- 🚫 Permission-denied state with direct link to system settings
- 📦 Persistent storage with AsyncStorage (survives app kill)

---

## Project Structure

```
src/
  app/
    _layout.tsx          ← Notification setup at app start
    index.tsx            ← Today's habits list
    new.tsx              ← Create / Edit habit form
    settings.tsx         ← Permissions + push token + instructions
    habit/[id].tsx       ← Habit detail (deep-link target)

  lib/
    habits/
      types.ts           ← Habit & Frequency types + helpers
      storage.ts         ← AsyncStorage CRUD + streak logic
    notifications/
      setup.ts           ← Channel, permission, foreground handler, tap handler
      schedule.ts        ← Schedule / cancel / reschedule reminders
      push.ts            ← Push registration + token storage

  hooks/
    use-habits.ts                ← Habit state + CRUD mutations
    use-push-notifications.ts   ← Push token registration
    use-notification-permission.ts ← Local permission management

  components/
    habit-card.tsx       ← Habit list item (streak, done button)
    emoji-picker.tsx     ← Scrollable emoji selector
    frequency-picker.tsx ← Daily/weekly toggle + time picker
    permission-banner.tsx ← Permission denied/undetermined UI
```

---

## Conceptual Writeup

### Local vs Push Notifications

| | Local | Push |
|---|---|---|
| **Origin** | Device-only, scheduled by the app | Sent from a server via Expo Push API |
| **Trigger** | Time-based (daily/weekly) | Server-initiated at any time |
| **When app is killed** | ✅ Still fires (OS-managed) | ✅ Still fires (FCM/APNs handles it) |
| **Requires internet** | ❌ No | ✅ Yes |
| **Use case** | Habit reminders | Streak nudges, announcements |
| **Works in Expo Go** | ✅ Yes | ❌ No (dev build required) |

### Push Ticket vs Receipt

When you send a push via the Expo API:
1. **Ticket** — returned immediately. Contains `status: 'ok'` and a `receiptId` (or `status: 'error'`).
2. **Receipt** — fetched later via `expo.dev/notifications/receipt`. Tells you if the message was successfully delivered to FCM/APNs.

You should check receipts to handle `DeviceNotRegistered` errors.

### DeviceNotRegistered

When Expo returns `DeviceNotRegistered` in a push receipt, it means the token is no longer valid (user uninstalled the app or revoked permissions). Your server should **remove the token from your database** and not send to it again.

### Expo Go Limitation

Expo Go does not support push notifications because it runs under a shared bundle ID. Push tokens are tied to a specific app's bundle ID + APNs/FCM credentials. Only a **development build** (created with EAS Build) has your app's real credentials, so push tokens can only be issued there.

### Android Channel — Why Before Permission?

On Android 8.0+ (API 26), notifications are posted to **channels**. The channel carries the `importance` level (sound, banner, vibration settings). 

If you create the channel **after** the permission is granted, the user may have already received lower-priority notifications. By creating `IMPORTANCE_HIGH` channel **before** requesting permission, you ensure that the first notification the user sees appears as a heads-up banner, not silently in the shade.

Additionally, Android silently drops notifications to non-existent channels — so the channel **must** exist before any notification can be posted.

---

## Running the App

```bash
# Install dependencies
npm install

# Start dev server (Expo Go — local notifications only)
npm run android

# For push notifications — create a dev build
eas build --profile development --platform android
```

---

## Testing Push Notifications

### via expo.dev/notifications

1. Open the app → Settings tab → copy your Expo Push Token.
2. Go to [expo.dev/notifications](https://expo.dev/notifications)
3. Paste your token, add this body:

```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title": "💧 Drink Water",
  "body": "Tap to log it.",
  "data": {
    "screen": "/habit",
    "habitId": "<your-habit-id>"
  }
}
```

4. Send and tap the notification → opens the correct habit detail screen.

### via cURL

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "title": "🏋️ Workout time!",
    "body": "Tap to log it.",
    "data": { "screen": "/habit", "habitId": "your-id-here" }
  }'
```

### via Node.js (expo-server-sdk)

```javascript
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendHabitNudge(token, habitId) {
  if (!Expo.isExpoPushToken(token)) {
    console.error('Invalid token:', token);
    return;
  }

  const [ticket] = await expo.sendPushNotificationsAsync([{
    to: token,
    sound: 'default',
    title: '🔥 Keep your streak alive!',
    body: 'Tap to log today\'s habit.',
    data: { screen: '/habit', habitId },
  }]);

  console.log('Ticket:', ticket);

  // Later: check receipts to handle DeviceNotRegistered
  if (ticket.id) {
    const receipts = await expo.getPushNotificationReceiptsAsync([ticket.id]);
    for (const [id, receipt] of Object.entries(receipts)) {
      if (receipt.status === 'error') {
        console.error('Receipt error:', receipt.message);
        if (receipt.details?.error === 'DeviceNotRegistered') {
          // Remove this token from your database
        }
      }
    }
  }
}
```

---

## Data Model

```typescript
type Frequency =
  | { kind: 'daily'; hour: number; minute: number }
  | { kind: 'weekly'; weekdays: number[]; hour: number; minute: number };

type Habit = {
  id: string;           // UUID
  name: string;
  emoji: string;
  frequency: Frequency;
  notificationIds: string[]; // Stored to cancel/reschedule
  streak: number;
  lastCompletedISO: string | null; // YYYY-MM-DD
};
```

---

## Evaluation Evidence

| Requirement | Status |
|---|---|
| Create / Edit / Delete habits | ✅ |
| Persist after app restart (AsyncStorage) | ✅ |
| Notification IDs stored per habit | ✅ |
| Daily reminders | ✅ |
| Weekly reminders | ✅ |
| Cancel only this habit's notifications on delete | ✅ |
| Streak increases on completion | ✅ |
| Missing a day resets streak | ✅ |
| Deep link from local notification | ✅ |
| Deep link from push notification | ✅ (same handler) |
| Permission denied — no crash | ✅ |
| Open system settings from denied state | ✅ |
| Foreground notification handler | ✅ |
| Android high-importance channel | ✅ |
| Push token display + copy | ✅ |
| Notification logic in `src/lib/notifications/` | ✅ |
| No notification logic in UI components | ✅ |
