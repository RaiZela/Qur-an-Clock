import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size ?? 28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="prayer-times"
        options={{
          title: 'Prayer Time',
             tabBarIcon: ({ color, size }) => <Ionicons name="timer-outline" size={size ?? 28} color={color} />,
        }}
      />
      <Tabs.Screen
          name="favorites"
          options={{
            title: "Saved",
               tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size ?? 28} color={color} />
          }}
        />
       <Tabs.Screen
          name="gratitude"
          options={{
            title: "Gratitude",
              tabBarIcon: ({ color, size }) => <Ionicons name="heart-circle" size={size ?? 28} color={color} />,
          }}
        />
      <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
             tabBarIcon: ({ color, size }) => <Ionicons name="chatbox" size={size ?? 28} color={color} />
          }}
        />
        <Tabs.Screen
            name="surahs"
            options={{
              title: "Surahs",
                 tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size ?? 28} color={color} />,
            }}
          />

        <Tabs.Screen
            name="today"
            options={{
              title: "Today",
                 tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size ?? 28} color={color} />,
            }}
          />
                  <Tabs.Screen
            name="habits"
            options={{
              title: "Habits",
                 tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-done-outline" size={size ?? 28} color={color} />,
            }}
          />
                  <Tabs.Screen
            name="stats"
            options={{
              title: "Stats",
                 tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size ?? 28} color={color} />,
            }}
          />
    </Tabs>
    
  );
}
