import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { getSession, onAuthStateChange } from '@/services/auth';
import { getOnboardingStatus } from '@/services/profiles';

/**
 * Tracks the Supabase auth session and redirects the user to the
 * correct part of the app (login / onboarding / tabs) based on
 * where they currently are and their auth + onboarding status.
 *
 * Extracted from the guard logic that used to live inline in app/_layout.tsx.
 */
export function useProtectedRoute() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Check session on mount
    getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    // Listen for auth changes (login/logout)
    const { data: authListener } = onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    // We identify where the user currently is in the app structure
    const inAuthGroup = segments[0] === '(auth)';
    const isOnboarding = segments[0] === 'onboarding';
    const isAtRoot = (segments as string[]).length === 0; // looks janks but type casting error occured here

    const checkNavigation = async () => {
      if (!session) {
        // 1. If not logged in and not in auth screens, force login
        if (!inAuthGroup) {
          router.replace('/(auth)/login');
        }
      } else {
        // 2. If logged in, we check the database for onboarding status
        try {
          const profile = await getOnboardingStatus(session.user.id);

          if (profile && !profile.onboarding_complete) {
            // User needs to finish setup
            if (!isOnboarding) {
              router.replace('/(auth)/onboarding');
            }
          } else {
            // 3. User is finished. Redirect to tabs if they are at the root or auth pages
            if (inAuthGroup || isOnboarding || isAtRoot) {
              router.replace('/(tabs)/home');
            }
          }
        } catch (err) {
          console.error("Navigation error:", err);
          // Fallback to avoid getting stuck
          if (inAuthGroup || isAtRoot) router.replace('/(tabs)/home');
        }
      }
    };

    checkNavigation();
  }, [session, segments, initialized]);

  return { session, initialized };
}
