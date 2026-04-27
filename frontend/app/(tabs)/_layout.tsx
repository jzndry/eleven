import React from 'react';
import { supabase } from '../../lib/supabase'; 
import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { Pressable, Alert } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabLayout() {
  const colorScheme = useColorScheme();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error", "Could not sign out. Please try again.");
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
        headerRight: () => (
          <Pressable onPress={handleSignOut} style={{ marginRight: 15 }}>
            {({ pressed }) => (
              <SymbolView
                name="rectangle.portrait.and.arrow.right"
                size={22}
                tintColor="#ef4444"
                style={{ opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <SymbolView name="house.fill" size={24} tintColor={color} />,
        }}
      />
      
      {/* 1. Added Schedule Tab */}
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <SymbolView name="calendar" size={24} tintColor={color} />,
        }}
      />

      <Tabs.Screen
        name="team"
        options={{
          title: 'Squad',
          tabBarIcon: ({ color }) => <SymbolView name="person.3.fill" size={24} tintColor={color} />,
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <SymbolView name="message.fill" size={24} tintColor={color} />,
        }}
      />

      {/* 2. Added HIDDEN Event Review Route */}
      <Tabs.Screen
        name="event-review/[id]"
        options={{
          href: null, // This is the 'magic' that keeps the bars but hides the icon
          title: 'AI Analysis',
        }}
      />
    </Tabs>
  );
}

export default TabLayout;