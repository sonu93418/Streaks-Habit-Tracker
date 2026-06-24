import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';

import { NB, Border } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const STORAGE_ONBOARDING_KEY = 'streaks_onboarding_completed_v1';

export default function SplashScreenComponent({ onFinish }: { onFinish?: () => void }) {
  const router = useRouter();
  const theme = useTheme();

  // Entrance animations for logo and text
  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(15);

  useEffect(() => {
    // Dismiss the native splash screen immediately when JS view renders
    SplashScreen.hideAsync().catch((err) => {
      console.warn('[splash] Failed to dismiss native splash screen:', err);
    });

    // Run entrance animations
    logoScale.value = withTiming(1, { duration: 600 });
    logoOpacity.value = withTiming(1, { duration: 600 });

    textOpacity.value = withDelay(250, withTiming(1, { duration: 600 }));
    textTranslateY.value = withDelay(250, withTiming(0, { duration: 600 }));
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
      opacity: logoOpacity.value,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslateY.value }],
    };
  });

  useEffect(() => {
    const routeTimer = setTimeout(async () => {
      if (onFinish) {
        onFinish();
      } else {
        try {
          const completed = await AsyncStorage.getItem(STORAGE_ONBOARDING_KEY);
          if (completed === 'true') {
            router.replace('/(tabs)' as any);
          } else {
            router.replace('/onboarding' as any);
          }
        } catch (err) {
          console.warn('Failed to read onboarding state in splash:', err);
          router.replace('/onboarding' as any);
        }
      }
    }, 1800);

    return () => clearTimeout(routeTimer);
  }, [router, onFinish]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Entrance animated logo icon card */}
        <Animated.View style={[styles.iconCardContainer, animatedLogoStyle]}>
          <View style={[styles.iconCardShadow, { backgroundColor: theme.text }]} />
          <View style={[styles.iconCard, { borderColor: theme.text, backgroundColor: NB.yellow }]}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Entrance animated texts */}
        <Animated.View style={[styles.textGroup, animatedTextStyle]}>
          <Text style={[styles.title, { color: theme.text }]}>STREAKS</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Build habits. Stay consistent.</Text>
        </Animated.View>

        {/* Loading Spinner */}
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={theme.text} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  iconCardContainer: {
    width: 130,
    height: 130,
    position: 'relative',
    marginBottom: 24,
  },
  iconCardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: -5,
    bottom: -5,
    borderRadius: Border.radiusLg,
  },
  iconCard: {
    width: '100%',
    height: '100%',
    borderWidth: Border.width,
    borderRadius: Border.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '80%',
    height: '80%',
  },
  textGroup: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 40,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
  },
  loaderContainer: {
    marginTop: 48,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
