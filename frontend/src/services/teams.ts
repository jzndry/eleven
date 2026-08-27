import { supabase } from './supabase';
import type { Team } from '@/types';

type TeamSummary = Pick<Team, 'id' | 'team_name' | 'home_ground_address' | 'training_ground_address' | 'join_code'>;

const TEAM_SUMMARY_COLUMNS = 'id, team_name, home_ground_address, training_ground_address, join_code';

/** The team owned by this coach — primary lookup path on the Settings screen. */
export async function getTeamByCoachId(coachId: string) {
  const { data } = await supabase.from('teams').select(TEAM_SUMMARY_COLUMNS).eq('coach_id', coachId).maybeSingle();
  return data as TeamSummary | null;
}

/** Fallback lookup by team_id, for coach profiles whose `coach_id` wasn't backfilled. */
export async function getTeamById(teamId: string) {
  const { data } = await supabase.from('teams').select(TEAM_SUMMARY_COLUMNS).eq('id', teamId).maybeSingle();
  return data as TeamSummary | null;
}

/** Just the team name — used for the Squad screen header. */
export async function getTeamName(teamId: string) {
  const { data } = await supabase.from('teams').select('team_name').eq('id', teamId).single();
  return data?.team_name as string | undefined;
}

/** Resolves a join code (entered at sign-up) to a team id. */
export async function findTeamByJoinCode(joinCode: string) {
  const { data, error } = await supabase.from('teams').select('id').eq('join_code', joinCode).maybeSingle();
  if (error) throw error;
  return data as Pick<Team, 'id'> | null;
}

/** Updates one editable team field (name / addresses) from the Settings screen. */
export function updateTeamField(teamId: string, field: string, value: string) {
  return supabase.from('teams').update({ [field]: value }).eq('id', teamId);
}

/** Creates the team row for a newly onboarded coach. */
export function createTeam(fields: { team_name: string; coach_id: string; join_code: string }) {
  return supabase.from('teams').insert([fields]);
}
