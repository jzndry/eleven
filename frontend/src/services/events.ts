import { supabase } from './supabase';
import type { Event, EventType } from '@/types';

/** The single next upcoming event for a team (closest future event_date), or null if none. */
export async function getNextEvent(teamId: string) {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('team_id', teamId)
    .gte('event_date', now)
    .order('event_date', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data as Event | null;
}

/** All events for a team, oldest first. The Schedule screen splits these into upcoming/past locally. */
export async function getTeamEvents(teamId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('team_id', teamId)
    .order('event_date', { ascending: true });
  if (error) throw error;
  return (data || []) as Event[];
}

/** A single event by id (Event Review hub). */
export async function getEventById(eventId: string) {
  const { data } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle();
  return data as Event | null;
}

/** Creates a new training/match event for a team. */
export function createEvent(fields: {
  team_id: string;
  event_type: EventType;
  location: string;
  opponent: string | null;
  event_date: string;
}) {
  return supabase.from('events').insert([fields]);
}
