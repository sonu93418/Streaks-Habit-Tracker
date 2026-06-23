/**
 * Streaks Habit Tracker — Design System
 *
 * Theme: Neo-Brutalism
 * - Thick 2–3px solid borders
 * - Hard drop shadows (no blur)
 * - Bold typography (700–900 weight)
 * - Cream/off-white light mode; near-black dark mode
 * - Accent: electric yellow (#FFE600)
 */

import '@/global.css';
import { Platform } from 'react-native';

// ─── Neo-Brutalism Palette ────────────────────────────────────────────────────

export const NB = {
  yellow: '#FFD400',       // Primary accent
  yellowDark: '#E0BA00',   // Pressed state
  coral: '#FF6B6B',        // Danger / streak reset
  coralDark: '#E05E5E',
  green: '#4ADE80',        // Success / done
  greenDark: '#39B367',
  blue: '#60A5FA',         // Push / info
  blueDark: '#478AD1',
  black: '#000000',        // Border & shadow
  white: '#FFF8E7',        // Light bg
  cream: '#FAF2DC',        // Card bg (light) - slightly darker for card contrast
  darkBg: '#0F0F0F',       // Dark mode bg
  darkCard: '#1A1A1A',     // Dark mode card
  darkBorder: '#333333',   // Dark mode border
} as const;

// ─── Theme Colors (light / dark) ──────────────────────────────────────────────

export const Colors = {
  light: {
    text: '#111111',
    background: NB.white,
    backgroundElement: NB.cream,
    backgroundSelected: '#EAE1CB',
    textSecondary: '#4B5563',
    border: NB.black,
    shadow: NB.black,
    accent: NB.yellow,
    success: NB.green,
    danger: NB.coral,
    info: NB.blue,
    card: NB.cream,
    tabBar: NB.white,
    tabBarBorder: NB.black,
  },
  dark: {
    text: '#FFFFFF',
    background: NB.darkBg,
    backgroundElement: NB.darkCard,
    backgroundSelected: '#252525',
    textSecondary: '#D1D5DB',
    border: NB.darkBorder,
    shadow: NB.black,
    accent: NB.yellow,
    success: NB.green,
    danger: NB.coral,
    info: NB.blue,
    card: NB.darkCard,
    tabBar: NB.darkBg,
    tabBarBorder: NB.darkBorder,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = typeof Colors.light;

// ─── Unified Typography System (Plus Jakarta Sans) ──────────────────────────

export const Typography = {
  hero: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -0.42, // -1% letter spacing
  },
  screenTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 32,
    lineHeight: 38,
  },
  sectionHeading: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 24,
    lineHeight: 30,
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 16,
    lineHeight: 22,
  },
  caption: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    lineHeight: 22,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// ─── Neo-Brutalism Tokens ─────────────────────────────────────────────────────

export const Border = {
  width: 3.5,
  radius: 12,
  radiusLg: 20,
  radiusSm: 8,
} as const;

export const Shadow = {
  /** Hard NB shadow — no blur, just offset */
  small: {
    shadowColor: NB.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  medium: {
    shadowColor: NB.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  large: {
    shadowColor: NB.black,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
} as const;

// ─── Layout ───────────────────────────────────────────────────────────────────

export const BottomTabInset = Platform.select({ ios: 130, android: 110 }) ?? 110;
export const MaxContentWidth = 800;
