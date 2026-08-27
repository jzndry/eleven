import { supabase } from './supabase';
import type { Questionnaire } from '@/types';

/** Count of submitted questionnaires for an event (drives the "responses received" progress). */
export async function getQuestionnaireCount(eventId: string) {
  const { count } = await supabase.from('questionnaires').select('id', { count: 'exact' }).eq('event_id', eventId);
  return count || 0;
}

/** Whether a specific player has already submitted a questionnaire for this event. */
export async function hasSubmittedQuestionnaire(eventId: string, playerId: string) {
  const { data } = await supabase
    .from('questionnaires')
    .select('id')
    .eq('event_id', eventId)
    .eq('player_id', playerId)
    .maybeSingle();
  return !!data;
}

/** The questionnaire a player already submitted for this event, if any (pre-fills + locks the review form). */
export async function getPlayerQuestionnaire(eventId: string, playerId: string) {
  const { data, error } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('event_id', eventId)
    .eq('player_id', playerId)
    .maybeSingle();
  if (error) throw error;
  return data as Questionnaire | null;
}

/** Submits a player's post-event questionnaire. */
export function submitQuestionnaire(fields: Omit<Questionnaire, 'id'>) {
  return supabase.from('questionnaires').insert(fields);
}
