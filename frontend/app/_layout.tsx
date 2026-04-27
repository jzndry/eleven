import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import "../global.css";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 1. Check current session on boot
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    // 2. Listen for login/logout changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // If NOT logged in and NOT in auth folder, go to login
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // If LOGGED in and in auth folder, go to app
      router.replace('/(tabs)');
    }
  }, [session, segments, initialized]);

  return <Slot />;
}