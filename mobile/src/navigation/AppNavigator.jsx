import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { topo, fonts, colors } from '../lib/theme'

import AuthScreen from '../screens/AuthScreen'
import OnboardingScreen from '../screens/OnboardingScreen'
import HomeScreen from '../screens/HomeScreen'
import LearningScreen from '../screens/LearningScreen'
import ChatScreen from '../screens/ChatScreen'
import NotebookScreen from '../screens/NotebookScreen'
import SummitScreen from '../screens/SummitScreen'
import SettingsScreen from '../screens/SettingsScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabIcon({ label, focused }) {
  return (
    <Text style={{
      fontFamily: fonts.mono,
      fontSize: 10,
      color: focused ? colors.phosphorGreen : topo.textDim,
    }}>
      {label}
    </Text>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: topo.bg,
          borderTopColor: topo.border,
          borderTopWidth: 1,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="HOME" focused={focused} /> }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="SHERPA" focused={focused} /> }}
      />
      <Tab.Screen
        name="Notebook"
        component={NotebookScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="NOTEBOOK" focused={focused} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="SETTINGS" focused={focused} /> }}
      />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  const { user, loading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()

  if (loading || profileLoading) {
    return null // Splash screen would go here
  }

  const needsOnboarding = user && profile && !profile.expedition_origin

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.phosphorGreen,
          background: topo.bg,
          card: topo.bg,
          text: topo.text,
          border: topo.border,
          notification: colors.signalOrange,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : needsOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Learning" component={LearningScreen} />
            <Stack.Screen name="Summit" component={SummitScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
