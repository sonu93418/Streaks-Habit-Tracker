import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

import { Pressable3D } from './pressable-3d';
import { NB, Border } from '@/constants/theme';

const STORAGE_ONBOARDING_KEY = 'streaks_onboarding_completed_v1';

type Props = {
  onComplete: () => void;
};

export function Onboarding({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = async () => {
    if (currentStep < 2) {
      setCurrentStep((prev) => prev + 1);
    } else {
      try {
        await AsyncStorage.setItem(STORAGE_ONBOARDING_KEY, 'true');
      } catch (err) {
        console.warn('Failed to save onboarding completion state:', err);
      }
      onComplete();
    }
  };

  const renderDots = () => {
    return (
      <View style={styles.dotContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: currentStep === i ? NB.yellow : '#EAE1CB',
                width: currentStep === i ? 24 : 12,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(400)}
            style={styles.slide}
            key="step0"
          >
            <View style={styles.textContainer}>
              <Text style={styles.welcomeLabel}>WELCOME TO</Text>
              <Text style={styles.title}>STREAKS</Text>
              <Text style={styles.description}>
                Build habits. Grow daily.{'\n'}Stay consistent.
              </Text>
            </View>

            {/* Premium 3D Tile surrounding generated 3D calendar image */}
            <View style={styles.imageCardContainer}>
              <View style={styles.imageCardShadow} />
              <View style={styles.imageCard}>
                <Image
                  source={require('../../assets/images/onboarding_1.png')}
                  style={styles.illustration}
                  resizeMode="contain"
                />
              </View>
            </View>
          </Animated.View>
        );
      case 1:
        return (
          <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(400)}
            style={styles.slide}
            key="step1"
          >
            <View style={styles.textContainer}>
              <Text style={styles.welcomeLabel}>EASY TRACKING</Text>
              <Text style={styles.title}>TRACK HABITS</Text>
              <Text style={styles.description}>
                Create habits, configure daily reminders, and track your daily progress.
              </Text>
            </View>

            {/* Premium 3D Tile surrounding generated 3D checklist image */}
            <View style={styles.imageCardContainer}>
              <View style={styles.imageCardShadow} />
              <View style={styles.imageCard}>
                <Image
                  source={require('../../assets/images/onboarding_2.png')}
                  style={styles.illustration}
                  resizeMode="contain"
                />
              </View>
            </View>
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(400)}
            style={styles.slide}
            key="step2"
          >
            <View style={styles.textContainer}>
              <Text style={styles.welcomeLabel}>STAY MOTIVATED</Text>
              <Text style={styles.title}>STAY ON STREAK</Text>
              <Text style={styles.description}>
                {"Don't break the chain! Keep your flame alive and feel the progress."}
              </Text>
            </View>

            {/* Premium 3D Tile surrounding generated 3D flame image */}
            <View style={styles.imageCardContainer}>
              <View style={styles.imageCardShadow} />
              <View style={styles.imageCard}>
                <Image
                  source={require('../../assets/images/onboarding_3.png')}
                  style={styles.illustration}
                  resizeMode="contain"
                />
              </View>
            </View>
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {getStepContent()}

          <View style={styles.footer}>
            {renderDots()}

            <Pressable3D
              onPress={handleNext}
              style={styles.nextBtnContainer}
              contentStyle={[
                styles.nextBtn,
                {
                  backgroundColor: currentStep === 2 ? NB.green : NB.yellow,
                },
              ]}
              shadowDepth={5}
            >
              <Text style={styles.nextBtnText}>
                {currentStep === 2 ? "Let's Get Started →" : 'Next →'}
              </Text>
            </Pressable3D>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Helper checker function for settings screen to query if onboarding is completed
export async function checkOnboardingCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

// Reset function to clear onboarding completion state for manual testing/resetting
export async function resetOnboardingState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_ONBOARDING_KEY);
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF8E7', // Match core theme background
    zIndex: 9999,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  textContainer: {
    alignItems: 'center',
    gap: 8,
  },
  welcomeLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#4A4A4A',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -0.8,
    color: '#111111',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    color: '#4A4A4A',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  imageCardContainer: {
    width: 250,
    height: 250,
    position: 'relative',
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
    backgroundColor: '#FAF2DC', // slightly offset cream background
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
    gap: 24,
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
});
