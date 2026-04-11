import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

import {
  HomeScreen,
  SessionScreen,
  HistoryScreen,
  StatsScreen,
  SettingsScreen,
  SessionDetailScreen,
} from './src/screens';
import { colors, spacing, touchTargets } from './src/theme';
import type { RootStackParamList, MainTabParamList } from './src/types';
import { useStore } from './src/store';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Custom dark theme for navigation
const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.surface,
    notification: colors.error,
  },
};

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'History':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Stats':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceLight,
          borderTopWidth: 1,
          height: 90,
          paddingBottom: spacing.lg,
          paddingTop: spacing.sm,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500' as const,
        },
        tabBarItemStyle: {
          minHeight: touchTargets.minimum,
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
      })}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home tab, start navigation sessions',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarAccessibilityLabel: 'History tab, view past sessions',
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarAccessibilityLabel: 'Statistics tab, view your usage data',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarAccessibilityLabel: 'Settings tab, customize app and device',
        }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  const loadSessions = useStore((state) => state.loadSessions);
  const subscribeToSessionUpdates = useStore((state) => state.subscribeToSessionUpdates);

  useEffect(() => {
    // Load sessions from Firestore on app start
    loadSessions();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToSessionUpdates();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DarkTheme}>
        <StatusBar style="light" />
        <View style={styles.container}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: colors.background },
              presentation: 'card',
              gestureEnabled: true,
            }}
          >
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
              name="Session"
              component={SessionScreen}
              options={{
                presentation: 'card',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="SessionDetail"
              component={SessionDetailScreen}
              options={{
                presentation: 'card',
                gestureEnabled: true,
              }}
            />
          </Stack.Navigator>
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
