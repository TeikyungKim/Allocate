import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { RootTabParamList, StrategyStackParamList, CalculatorStackParamList, PortfolioStackParamList, SettingsStackParamList } from './types';

import { StrategyListScreen } from '../screens/strategy/StrategyListScreen';
import { StrategyDetailScreen } from '../screens/strategy/StrategyDetailScreen';
import { CalculatorScreen } from '../screens/calculator/CalculatorScreen';
import { PortfolioListScreen } from '../screens/portfolio/PortfolioListScreen';
import { PortfolioDetailScreen } from '../screens/portfolio/PortfolioDetailScreen';
import { CustomStrategyScreen } from '../screens/portfolio/CustomStrategyScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const StrategyStack = createNativeStackNavigator<StrategyStackParamList>();
const CalculatorStack = createNativeStackNavigator<CalculatorStackParamList>();
const PortfolioStack = createNativeStackNavigator<PortfolioStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function StrategyNavigator() {
  const { theme } = useTheme();
  return (
    <StrategyStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <StrategyStack.Screen name="StrategyList" component={StrategyListScreen} options={{ headerShown: false }} />
      <StrategyStack.Screen name="StrategyDetail" component={StrategyDetailScreen} options={{ title: '전략 상세' }} />
      <StrategyStack.Screen name="CustomStrategy" component={CustomStrategyScreen} options={{ title: '커스텀 전략' }} />
    </StrategyStack.Navigator>
  );
}

function CalculatorNavigator() {
  const { theme } = useTheme();
  return (
    <CalculatorStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <CalculatorStack.Screen name="Calculator" component={CalculatorScreen} options={{ headerShown: false }} />
    </CalculatorStack.Navigator>
  );
}

function PortfolioNavigator() {
  const { theme } = useTheme();
  return (
    <PortfolioStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <PortfolioStack.Screen name="PortfolioList" component={PortfolioListScreen} options={{ headerShown: false }} />
      <PortfolioStack.Screen name="PortfolioDetail" component={PortfolioDetailScreen} options={{ title: '포트폴리오 상세' }} />
      <PortfolioStack.Screen name="CustomStrategy" component={CustomStrategyScreen} options={{ title: '커스텀 전략' }} />
    </PortfolioStack.Navigator>
  );
}

function SettingsNavigator() {
  const { theme } = useTheme();
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <SettingsStack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </SettingsStack.Navigator>
  );
}

const TabIcon = ({ label, focused, color }: { label: string; focused: boolean; color: string }) => (
  <Text style={{ fontSize: 20 }}>{label}</Text>
);

export function RootNavigator() {
  const { isDark, theme } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textTertiary,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tab.Screen
          name="StrategyTab"
          component={StrategyNavigator}
          options={{
            tabBarLabel: '전략',
            tabBarIcon: ({ focused, color }) => <TabIcon label="📊" focused={focused} color={color} />,
          }}
        />
        <Tab.Screen
          name="CalculatorTab"
          component={CalculatorNavigator}
          options={{
            tabBarLabel: '계산기',
            tabBarIcon: ({ focused, color }) => <TabIcon label="🧮" focused={focused} color={color} />,
          }}
        />
        <Tab.Screen
          name="PortfolioTab"
          component={PortfolioNavigator}
          options={{
            tabBarLabel: '포트폴리오',
            tabBarIcon: ({ focused, color }) => <TabIcon label="💼" focused={focused} color={color} />,
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsNavigator}
          options={{
            tabBarLabel: '설정',
            tabBarIcon: ({ focused, color }) => <TabIcon label="⚙️" focused={focused} color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
