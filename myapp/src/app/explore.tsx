/**
 * src/app/explore.tsx
 *
 * This screen is hidden from the tab bar (href: null in _layout.tsx).
 * Kept as a valid module so expo-router route discovery does not fail.
 * The original template screen was replaced because it imported
 * expo-symbols and other template-only packages not available in Expo Go.
 */

import { Redirect } from 'expo-router';

export default function ExploreScreen() {
  // Redirect to Today screen — explore is not used in Streaks
  return <Redirect href={"/(tabs)/" as any} />;
}
