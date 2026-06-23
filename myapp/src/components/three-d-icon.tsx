import React from 'react';
import { StyleSheet, View, Text, ViewStyle, StyleProp } from 'react-native';
// eslint-disable-next-line import/no-unresolved
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Border } from '@/constants/theme';

export type IconType =
  | 'home'
  | 'add'
  | 'streak'
  | 'notifications'
  | 'settings'
  | 'water'
  | 'read'
  | 'code'
  | 'workout'
  | 'coffee'
  | 'focus'
  | 'sleep';

type Props = {
  name: IconType;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
  showBorder?: boolean;
  shadowDepth?: number;
};

// Preset mapping for our 3D Icon Pack to ensure cohesive styling
const ICON_PRESETS: Record<
  IconType,
  {
    library: 'Ionicons' | 'MaterialIcons';
    iconName: string;
    bg: string;
    iconColor: string;
  }
> = {
  home: { library: 'Ionicons', iconName: 'home', bg: '#FFD400', iconColor: '#000000' }, // Primary Yellow
  add: { library: 'Ionicons', iconName: 'add', bg: '#4ADE80', iconColor: '#000000' }, // Success Green
  streak: { library: 'Ionicons', iconName: 'flame', bg: '#FF6B6B', iconColor: '#FFFFFF' }, // Warning Red
  notifications: { library: 'Ionicons', iconName: 'notifications', bg: '#60A5FA', iconColor: '#000000' }, // Accent Blue
  settings: { library: 'Ionicons', iconName: 'settings', bg: '#A78BFA', iconColor: '#000000' }, // Vibrant Violet
  water: { library: 'MaterialIcons', iconName: 'water', bg: '#38BDF8', iconColor: '#FFFFFF' }, // Sky Blue
  workout: { library: 'MaterialIcons', iconName: 'fitness-center', bg: '#F87171', iconColor: '#FFFFFF' }, // Dumbbell Coral
  read: { library: 'Ionicons', iconName: 'book', bg: '#FB923C', iconColor: '#FFFFFF' }, // Book Orange
  code: { library: 'MaterialIcons', iconName: 'code', bg: '#475569', iconColor: '#FFFFFF' }, // Slate Blue
  coffee: { library: 'MaterialIcons', iconName: 'local-cafe', bg: '#DDB892', iconColor: '#4A3728' }, // Latte Brown
  focus: { library: 'MaterialIcons', iconName: 'center-focus-strong', bg: '#F43F5E', iconColor: '#FFFFFF' }, // Target Rose
  sleep: { library: 'Ionicons', iconName: 'moon', bg: '#1E1B4B', iconColor: '#FCD34D' }, // Midnight Navy + Moon Yellow
};

export function ThreeDIcon({
  name,
  size = 28,
  backgroundColor,
  iconColor,
  style,
  showBorder = true,
  shadowDepth = 3,
}: Props) {
  const isPreset = name in ICON_PRESETS;
  const preset = isPreset ? ICON_PRESETS[name as IconType] : null;
  const bg = backgroundColor || (preset ? preset.bg : '#FFD400'); // default yellow for fallbacks
  const color = iconColor || (preset ? preset.iconColor : '#000000');

  const renderIcon = (offset: boolean) => {
    if (!preset) return null;
    const iconSize = size;
    const finalColor = offset ? '#000000' : color;
    const offsetStyle = offset
      ? { position: 'absolute' as const, top: 1.5, left: 1.5 }
      : { position: 'relative' as const };

    if (preset.library === 'Ionicons') {
      return (
        <Ionicons
          name={preset.iconName as any}
          size={iconSize}
          color={finalColor}
          style={offsetStyle}
        />
      );
    } else {
      return (
        <MaterialIcons
          name={preset.iconName as any}
          size={iconSize}
          color={finalColor}
          style={offsetStyle}
        />
      );
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* 3D Extrusion Shadow Layer */}
      {showBorder && (
        <View
          style={[
            styles.shadowLayer,
            {
              top: shadowDepth,
              left: shadowDepth,
            },
          ]}
        />
      )}

      {/* Main 3D Card Tile */}
      <View
        style={[
          styles.mainCard,
          {
            backgroundColor: bg,
            borderWidth: showBorder ? Border.width : 0,
            width: size + 20,
            height: size + 20,
          },
        ]}
      >
        {/* Glossy Overlay Sheen */}
        <View style={styles.glossySheen} />

        {/* 3D Embossed Icon or Fallback Text */}
        <View style={styles.iconWrapper}>
          {preset ? (
            <>
              {renderIcon(true)}
              {renderIcon(false)}
            </>
          ) : (
            <Text style={{ fontSize: size }}>{name}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  shadowLayer: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    backgroundColor: '#000000',
    borderRadius: 14,
  },
  mainCard: {
    borderColor: '#000000',
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glossySheen: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: '150%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ skewX: '-30deg' }, { translateY: 10 }],
    pointerEvents: 'none',
  },
});
