/** A user's role determines which screens/actions they can access. */
export type Role = 'coach' | 'player';

/**
 * Row shape of the `profiles` table. One row per auth user, created by a
 * Supabase DB trigger on sign-up and filled in during onboarding.
 */
export interface Profile {
  id: string;
  role: Role;
  team_id: string | null;
  full_name: string;
  position: string | null; // player-only, e.g. "Striker"
  onboarding_complete: boolean;
  created_at: string; // ISO timestamp
}
