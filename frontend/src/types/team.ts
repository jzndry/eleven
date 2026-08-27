/** Row shape of the `teams` table. One row per squad, owned by a coach. */
export interface Team {
  id: string;
  team_name: string;
  home_ground_address: string | null;
  training_ground_address: string | null;
  join_code: string; // shown to the coach, entered by players at sign-up
  coach_id: string;
}
