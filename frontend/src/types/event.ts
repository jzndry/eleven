export type EventType = 'training' | 'match';

/** Row shape of the `events` table — a single training session or match. */
export interface Event {
  id: string;
  team_id: string;
  event_type: EventType;
  opponent: string | null; // match-only
  location: string | null;
  event_date: string; // ISO timestamp
  event_summary: string | null; // AI-generated post-event summary, written by the backend processor
}
