/** A player's RSVP for an event. No row in `event_attendance` means "no response". */
export type AttendanceStatus = 'attending' | 'declined';

/** Row shape of the `event_attendance` table (composite unique key: event_id + player_id). */
export interface EventAttendance {
  event_id: string;
  player_id: string;
  status: AttendanceStatus;
}

/** Tallied RSVP counts for an event, used to render the coach's attendance breakdown. */
export interface AttendanceStats {
  attending: number;
  declined: number;
  no_response: number;
  total: number;
}
