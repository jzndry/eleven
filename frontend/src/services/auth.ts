import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

/** The currently authenticated Supabase user, or null if there's no active session. */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

export function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signUpWithEmail(email: string, password: string, metadata: Record<string, unknown>) {
  return supabase.auth.signUp({ email, password, options: { data: metadata } });
}

export function signOut() {
  return supabase.auth.signOut();
}

export function updateEmail(email: string) {
  return supabase.auth.updateUser({ email });
}
