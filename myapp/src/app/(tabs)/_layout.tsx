import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Border, Colors, NB, Shadow } from '@/constants/theme';
import { useThemeContext } from '@/hooks/useTheme';

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const scale = useSharedValue(focused ? 1.1 : 1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, {
      damping: 15,
      stiffness: 150,
    });
  }, [focused, scale]);

  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  let iconName = '';
  if (name === 'home') iconName = focused ? 'home' : 'home-outline';
  else if (name === 'add') iconName = focused ? 'add-circle' : 'add-circle-outline';
  else if (name === 'notifications') iconName = focused ? 'notifications' : 'notifications-outline';
  else if (name === 'settings') iconName = focused ? 'settings' : 'settings-outline';

  return (
    <Animated.View style={[animStyle, { height: 28, justifyContent: 'center', alignItems: 'center' }]}>
      <Ionicons name={iconName as any} size={26} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useThemeContext();
  const insets = useSafeAreaInsets();

  const activeColor = isDark ? colors.accent : '#C09000';
  const inactiveColor = colors.textSecondary;

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: Math.max(insets.bottom, 12),
            height: 80,
            paddingBottom: Platform.OS === 'ios' ? 16 : 10,
            paddingTop: 10,
            backgroundColor: colors.tabBar,
            borderWidth: Border.width,
            borderColor: isDark ? '#FFFFFF' : '#000000',
            borderRadius: 24,
            ...Shadow.large,
            shadowColor: isDark ? '#FFFFFF' : '#000000',
            elevation: 8,
          },
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
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
                  color: focused ? activeColor : inactiveColor,
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {label}
              </Text>
            );
          },
          tabBarItemStyle: {
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          },
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color }) => <TabIcon name="home" focused={focused} color={color} />,
          }}
        />

        <Tabs.Screen
          name="add"
          options={{
            title: 'Add',
            tabBarIcon: ({ focused, color }) => <TabIcon name="add" focused={focused} color={color} />,
          }}
        />

        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ focused, color }) => <TabIcon name="notifications" focused={focused} color={color} />,
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused, color }) => <TabIcon name="settings" focused={focused} color={color} />,
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
