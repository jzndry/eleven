import React from 'react';
import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import Colors from '@/styles/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useClientOnlyValue } from '@/hooks/useClientOnlyValue';

function TabLayout() {
  const colorScheme = useColorScheme();


  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true)
      }}>

      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <SymbolView name="house.fill" size={24} tintColor={color} />,
        }}
      />
      
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <SymbolView name="calendar" size={24} tintColor={color} />,
        }}
      />

      <Tabs.Screen
        name="squad"
        options={{
          title: 'Squad',
          tabBarIcon: ({ color }) => <SymbolView name="person.3.fill" size={24} tintColor={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <SymbolView name="gearshape.fill" size={24} tintColor={color} />,
        }}
      />

      {/* Hidden Event Review Route */}
      <Tabs.Screen
        name="event-review/[id]"
        options={{
          href: null, // Keeps the bars but hides the icon
          title: 'AI Analysis',
        }}
      />

      {/* Hidden Event Player Route */}
      <Tabs.Screen
        name="player/[id]"
        options={{
          href: null, // Keeps the bars but hides the icon
          title: 'Player Details',
        }}
      />

      
    </Tabs>
  );
}

export default TabLayout;