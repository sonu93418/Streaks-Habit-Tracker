import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Pressable3D } from '@/components/pressable-3d';
import { NB, Border, Colors, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const STORAGE_ONBOARDING_KEY = 'streaks_onboarding_completed_v1';

export default function OnboardingSlide3() {
  const router = useRouter();
  const theme = useTheme();

  const handleStart = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_ONBOARDING_KEY, 'true');
      router.replace('/(tabs)/' as any);
    } catch (err) {
      console.warn('Failed to save onboarding completion state:', err);
      router.replace('/(tabs)/' as any);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.slide}>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.text }]}>Stay on Streak</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                Don't break the chain! Keep your flame alive and feel the progress.
              </Text>
            </View>

            {/* Premium 3D Tile surrounding generated 3D flame image */}
            <View style={styles.imageCardContainer}>
              <View style={styles.imageCardShadow} />
              <View style={styles.imageCard}>
                <Image
                  source={require('../../../assets/images/onboarding_3.png')}
                  style={styles.illustration}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            {/* Dots */}
            <View style={styles.dotContainer}>
              <View style={[styles.dot, { backgroundColor: theme.textSecondary + '30', width: 12 }]} />
              <View style={[styles.dot, { backgroundColor: theme.textSecondary + '30', width: 12 }]} />
              <View style={[styles.dot, { backgroundColor: NB.yellow, width: 24 }]} />
            </View>

            <Pressable3D
              onPress={handleStart}
              style={styles.nextBtnContainer}
              contentStyle={[styles.nextBtn, { backgroundColor: NB.yellow }]}
              shadowDepth={5}
            >
              <Text style={styles.nextBtnText}>Let's Get Started →</Text>
            </Pressable3D>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
  },
  title: {
    ...Typography.screenTitle,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  imageCardContainer: {
    width: 260,
    height: 260,
    position: 'relative',
    marginTop: 10,
  },
  imageCardShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,
    backgroundColor: '#000000',
    borderRadius: Border.radiusLg,
  },
  imageCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF2DC',
    borderWidth: Border.width,
    borderColor: '#000000',
    borderRadius: Border.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  illustration: {
    width: '90%',
    height: '90%',
  },
  footer: {
    gap: 28,
    alignItems: 'center',
    marginBottom: 10,
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000000',
  },
  nextBtnContainer: {
    width: '100%',
    height: 60,
  },
  nextBtn: {
    height: 60,
    borderWidth: Border.width,
    borderColor: '#000000',
    borderRadius: Border.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    ...Typography.button,
    color: '#000000',
  },
});
