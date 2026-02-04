import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="prayer-times"
        options={{
          title: 'Prayer Time',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
          name="favorites"
          options={{
            title: "Saved",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
          }}
        />
       <Tabs.Screen
          name="gratitude"
          options={{
            title: "Gratitude",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.circle.fill" color={color} />,
          }}
        />
      <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="message" color={color} />,
          }}
        />
        <Tabs.Screen
            name="surahs"
            options={{
              title: "Surahs",
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
            }}
          />

    </Tabs>
    
  );
}
