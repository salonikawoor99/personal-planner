import {
  DarkTheme,
  DefaultTheme,
  Tabs,
  ThemeProvider,
} from 'expo-router';

import {
  useColorScheme,
} from 'react-native';

import {
  PlannerProvider,
} from '@/context/planner-context';

export default function TabLayout() {
  const colorScheme =
    useColorScheme();

  return (
    <PlannerProvider>
      <ThemeProvider
        value={
          colorScheme === 'dark'
            ? DarkTheme
            : DefaultTheme
        }
      >
        <Tabs
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Today',
            }}
          />

          <Tabs.Screen
            name="week"
            options={{
              title: 'Week',
            }}
          />

          <Tabs.Screen
            name="month"
            options={{
              title: 'Month',
            }}
          />

          <Tabs.Screen
            name="free-slot"
            options={{
              href: null,
            }}
          />

          <Tabs.Screen
            name="confirm-time"
            options={{
              href: null,
            }}
          />

          <Tabs.Screen
            name="suggest-new-time"
            options={{
              href: null,
            }}
          />

          <Tabs.Screen
            name="add-task"
            options={{
              href: null,
            }}
          />

          <Tabs.Screen
            name="task-details"
            options={{
              href: null,
            }}
          />

          <Tabs.Screen
            name="recover-task"
            options={{
              href: null,
            }}
          />

          <Tabs.Screen
            name="explore"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </ThemeProvider>
    </PlannerProvider>
  );
}