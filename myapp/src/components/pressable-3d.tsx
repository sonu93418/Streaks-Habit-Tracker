import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  shadowColor?: string;
  shadowDepth?: number;
  disabled?: boolean;
};

export function Pressable3D({
  children,
  onPress,
  style,
  contentStyle,
  shadowColor = '#000000',
  shadowDepth = 4,
  disabled = false,
}: Props) {
  const isPressed = useSharedValue(0);

  // Drive the animated position via shared value so useAnimatedStyle only reads it.
  // withSpring must be assigned to the .value, not called inside useAnimatedStyle.
  const pressOffset = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: pressOffset.value },
        { translateY: pressOffset.value },
      ],
    };
  });

  const handlePressIn = () => {
    if (!disabled) {
      isPressed.value = 1;
      pressOffset.value = withSpring(shadowDepth, { damping: 15, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    isPressed.value = 0;
    pressOffset.value = withSpring(0, { damping: 15, stiffness: 200 });
  };

  return (
    <View style={[styles.container, style]}>
      {/* 3D Drop Shadow / Extrusion Layer */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          contentStyle,
          {
            backgroundColor: shadowColor,
            top: shadowDepth,
            left: shadowDepth,
          },
        ]}
      />

      {/* Main Interactive Button Layer */}
      <Animated.View style={[contentStyle, animatedStyle]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={({ pressed }) => [
            styles.pressable,
            disabled && styles.disabled,
          ]}
        >
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  pressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.7,
  },
});
