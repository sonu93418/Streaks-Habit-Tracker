import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
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
import SplashScreenComponent from '@/components/splash-screen';

// Prevent the native splash screen from auto-hiding before assets are loaded.
SplashScreen.preventAutoHideAsync().catch(() => {});

declare global {
  var isAppInitialized: boolean | undefined;
}

// Flag to track if the custom JS splash screen has completed its initialization.
// Module-level variables persist across hot reloads in React Native, preventing
// Fast Refresh from resetting the flag and forcing a splash reload loop.
let isAppInitialized = false;
if (typeof global !== 'undefined' && global.isAppInitialized) {
  isAppInitialized = true;
}

function RootLayoutContent() {
  const { isDark } = useThemeContext();
  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding/slide2" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding/slide3" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="habit/[id]" />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const tapListenerRef = useRef<{ remove: () => void } | null>(null);
  const [showSplash, setShowSplash] = useState(!isAppInitialized);

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
    return null; // Hold native splash screen until font resources are ready
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <RootLayoutContent />
        {showSplash && (
          <View style={StyleSheet.absoluteFill}>
            <SplashScreenComponent
              onFinish={() => {
                isAppInitialized = true;
                if (typeof global !== 'undefined') {
                  global.isAppInitialized = true;
                }
                setShowSplash(false);
              }}
            />
          </View>
        )}
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
