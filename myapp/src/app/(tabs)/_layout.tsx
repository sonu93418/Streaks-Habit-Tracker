import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { Border, Colors, NB, Shadow } from '@/constants/theme';
import { ThreeDIcon, IconType } from '@/components/three-d-icon';
import { useThemeContext } from '@/hooks/useTheme';

function TabIcon({ name, focused }: { name: IconType; focused: boolean }) {
  const scale = useSharedValue(focused ? 1.15 : 1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, {
      damping: 10,
      stiffness: 150,
    });
  }, [focused, scale]);

  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[animStyle, { height: 42, justifyContent: 'center' }]}>
      <ThreeDIcon
        name={name}
        size={22}
        showBorder={focused}
        shadowDepth={focused ? 2.5 : 0}
        backgroundColor={focused ? undefined : 'transparent'}
        iconColor={focused ? undefined : '#6A6A6A'}
      />
    </Animated.View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useThemeContext();
  const insets = useSafeAreaInsets();

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: Math.max(insets.bottom, 10),
            height: 76,
            paddingBottom: Platform.OS === 'ios' ? 12 : 8,
            paddingTop: 8,
            backgroundColor: colors.tabBar,
            borderWidth: Border.width,
            borderColor: NB.black,
            borderRadius: Border.radiusLg,
            ...Shadow.large,
            shadowColor: NB.black,
            elevation: 8,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarLabel: ({ focused }) => {
            let label = '';
            if (route.name === 'index') label = 'Home';
            else if (route.name === 'add') label = 'Add';
            else if (route.name === 'notifications') label = 'Alerts';
            else if (route.name === 'settings') label = 'Settings';

            return (
              <Text
                style={{
                  fontFamily: focused ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                  fontSize: 12,
                  color: focused ? colors.accent : colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {label}
              </Text>
            );
          },
          tabBarItemStyle: {
            borderRadius: Border.radius,
            marginHorizontal: 3,
            marginVertical: 2,
          },
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
          }}
        />

        <Tabs.Screen
          name="add"
          options={{
            title: 'Add',
            tabBarIcon: ({ focused }) => <TabIcon name="add" focused={focused} />,
          }}
        />

        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ focused }) => <TabIcon name="notifications" focused={focused} />,
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
