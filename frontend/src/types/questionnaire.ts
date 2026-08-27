/** Row shape of the `questionnaires` table — a player's post-event feedback form. */
export interface Questionnaire {
  id: string;
  event_id: string;
  player_id: string;
  team_performance_rating: number; // 1-10 slider
  player_performance_satisfaction: number; // 1-10 slider
  tactics_comment: string;
  further_comments: string;
}
