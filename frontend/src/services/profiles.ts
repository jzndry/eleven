import { supabase } from './supabase';
import type { Profile } from '@/types';

/**
 * Role + team assignment for a user — the two fields almost every screen
 * needs first to decide what to fetch or where to route next.
 * Returns null if the profile row doesn't exist yet.
 */
export async function getRoleAndTeam(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('role, team_id')
    .eq('id', userId)
    .maybeSingle();
  return data as Pick<Profile, 'role' | 'team_id'> | null;
}

/** Onboarding status for a user — used by the root route guard to decide where to redirect. */
export async function getOnboardingStatus(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as Pick<Profile, 'onboarding_complete'>;
}

/** Full profile row for a specific user (Player Detail screen). */
export async function getProfileById(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

/** The subset of profile fields shown/edited on the Settings screen. */
export async function getSettingsProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, role, position, team_id')
    .eq('id', userId)
    .maybeSingle();
  return data as Pick<Profile, 'full_name' | 'role' | 'position' | 'team_id'> | null;
}

/** Every player profile on a team, alphabetised by name (Squad screen roster). */
export async function getTeamPlayers(teamId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('team_id', teamId)
    .eq('role', 'player')
    .order('full_name');
  if (error) throw error;
  return (data || []) as Profile[];
}

/** Count of players on a team — used for squad-size stats and as the attendance denominator. */
export async function getTeamPlayerCount(teamId: string) {
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .eq('team_id', teamId)
    .eq('role', 'player');
  return count || 0;
}

/** Updates a single profile field (used by the Settings screen's inline editors). */
export function updateProfileField(userId: string, field: string, value: string) {
  return supabase.from('profiles').update({ [field]: value }).eq('id', userId);
}

/** Completes onboarding: saves name/position and marks the profile as fully set up. */
export function completeOnboarding(userId: string, fields: { full_name: string; position: string | null }) {
  return supabase
    .from('profiles')
    .update({ ...fields, onboarding_complete: true })
    .eq('id', userId);
}

/** Unassigns a player from their team. We keep the profile row rather than deleting it. */
export function removePlayerFromTeam(playerId: string) {
  return supabase.from('profiles').update({ team_id: null }).eq('id', playerId);
}

/** Permanently deletes a profile row (account deletion). */
export function deleteProfile(userId: string) {
  return supabase.from('profiles').delete().eq('id', userId);
}
