import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';

import {
  createAndroidChannel,
  registerForegroundHandler,
  registerTapHandler,
} from '@/lib/notifications/setup';
import { ThemeProvider as AppThemeProvider, useThemeContext } from '@/hooks/useTheme';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the native splash screen from auto-hiding before assets are loaded.
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutContent() {
  const { isDark } = useThemeContext();
  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="onboarding/slide2" />
        <Stack.Screen name="onboarding/slide3" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="habit/[id]" />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const tapListenerRef = useRef<{ remove: () => void } | null>(null);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    createAndroidChannel();
    registerForegroundHandler();
    tapListenerRef.current = registerTapHandler();

    return () => {
      tapListenerRef.current?.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null; // Hold splash screen until font resources are ready
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <RootLayoutContent />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
