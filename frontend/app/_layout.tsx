import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import "../global.css";

function InitialLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    // Listen for auth changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboarding = segments[0] === 'onboarding';

    const checkNavigation = async () => {
      if (!session) {
        // 1. If not logged in and not in auth screens, force login
        if (!inAuthGroup) {
          router.replace('/(auth)/login');
        }
      } else {
        // 2. If logged in, we check the database for onboarding status
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;

          if (profile && !profile.onboarding_complete) {
            // User needs to finish setup
            if (!isOnboarding) {
              router.replace('/(auth)/onboarding');
            }
          } else {
            // User is finished, if they are still in auth screens, move them to the app
            if (inAuthGroup || isOnboarding) {
              router.replace('/(tabs)');
            }
          }
        } catch (err) {
          console.error("Navigation error:", err);
          // Fallback to avoid getting stuck
          if (inAuthGroup) router.replace('/(tabs)');
        }
      }
    };

    checkNavigation();
  }, [session, segments, initialized]);

  // Initialised guard to prevent screen flicker before we know the auth state
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return <InitialLayout />;
}