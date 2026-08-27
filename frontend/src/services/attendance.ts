import { supabase } from './supabase';
import type { AttendanceStats, AttendanceStatus } from '@/types';

/** Raw attendance rows (status only) for an event — used to tally counts. */
export async function getEventAttendanceStatuses(eventId: string) {
  const { data } = await supabase.from('event_attendance').select('status').eq('event_id', eventId);
  return (data || []) as { status: AttendanceStatus }[];
}

/** One player's RSVP status for an event, or null if they haven't responded. */
export async function getPlayerAttendanceStatus(eventId: string, playerId: string) {
  const { data } = await supabase
    .from('event_attendance')
    .select('status')
    .eq('event_id', eventId)
    .eq('player_id', playerId)
    .maybeSingle();
  return (data?.status as AttendanceStatus | undefined) ?? null;
}

/** Records or updates a player's RSVP for an event. */
export function setAttendanceStatus(eventId: string, playerId: string, status: AttendanceStatus) {
  return supabase
    .from('event_attendance')
    .upsert({ event_id: eventId, player_id: playerId, status }, { onConflict: 'event_id, player_id' });
}

/** Tallies attending/declined/no-response counts for an event, given the squad size. */
export function summarizeAttendance(statuses: { status: AttendanceStatus }[], totalPlayers: number): AttendanceStats {
  let attending = 0;
  let declined = 0;
  statuses.forEach((row) => {
    if (row.status === 'attending') attending++;
    if (row.status === 'declined') declined++;
  });
  return { attending, declined, no_response: totalPlayers - (attending + declined), total: totalPlayers };
}
