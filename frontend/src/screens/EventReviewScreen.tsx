import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router'; 
import { supabase } from '@/services/supabase';
import { SymbolView } from 'expo-symbols';

import { AttendanceView } from '@/components/AttendanceView';
import { ReviewForm } from '@/components/ReviewForm';
import { CoachSummary } from '@/components/CoachSummary';

export default function EventHubScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter(); 
  const eventId = typeof id === 'string' ? id : id[0];
  const [activeTab, setActiveTab] = useState('attendance'); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<'player' | 'coach' | null>(null);
  
  const [eventInfo, setEventInfo] = useState({ type: '', opponent: '', dateStr: '', summary: null });
  const [hasEventPassed, setHasEventPassed] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({ attending: 0, declined: 0, no_response: 0, total: 0 });
  const [responseCount, setResponseCount] = useState(0); 
  const [playerStatus, setPlayerStatus] = useState<string | null>(null); 

  useEffect(() => {
    if (eventId) fetchHubData();
  }, [eventId]);

  async function fetchHubData() {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('role, team_id').eq('id', user.id).single();
      if (profile) setCurrentUserRole(profile.role as 'player' | 'coach');
      
      const { data: event } = await supabase.from('events').select('*').eq('id', eventId).single();
      if (event) {
        setEventInfo({
          type: event.event_type,
          opponent: event.opponent || '',
          summary: event.event_summary, // Capture the AI summary
          dateStr: new Date(event.event_date).toLocaleDateString('en-GB', { 
            weekday: 'short', day: 'numeric', month: 'short' 
          })
        });
        setHasEventPassed(new Date(event.event_date) < new Date());
        
        if (profile?.role === 'coach') {
          await fetchCoachStats(event.id, event.team_id);
        } else {
          await fetchPlayerStatus(event.id, user.id);
        }
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }

  async function fetchCoachStats(evId: string, teamId: string) {
    // Get total players in squad
    const { count: totalPlayers } = await supabase.from('profiles').select('id', { count: 'exact' }).eq('team_id', teamId).eq('role', 'player');
    
    // Get attendance record
    const { data: attendanceData } = await supabase.from('event_attendance').select('status').eq('event_id', evId);
    
    // get questionnaire count
    const { count: questionnairesDone } = await supabase.from('questionnaires').select('id', { count: 'exact' }).eq('event_id', evId);
    
    let att = 0; let dec = 0;
    attendanceData?.forEach(r => { 
      if(r.status === 'attending') att++; 
      if(r.status === 'declined') dec++; 
    });

    setAttendanceStats({ 
      attending: att, 
      declined: dec, 
      no_response: (totalPlayers || 0) - (att + dec), 
      total: totalPlayers || 0 
    });
    
    setResponseCount(questionnairesDone || 0);
  }

  async function fetchPlayerStatus(evId: string, userId: string) {
    const { data } = await supabase.from('event_attendance').select('status').eq('event_id', evId).eq('player_id', userId).single();
    if (data) setPlayerStatus(data.status);
    
    // Check if player already submitted review to show success state,
    //  we check this on the player view because coaches shouldn't see the review form at all, so no need to check for them
    const { data: review } = await supabase.from('questionnaires').select('id').eq('event_id', evId).eq('player_id', userId).maybeSingle();
    if (review) setIsSubmitted(true);
  }

  const handleRSVP = async (status: 'attending' | 'declined') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('event_attendance').upsert({ event_id: eventId, player_id: user.id, status }, { onConflict: 'event_id, player_id' });
    setPlayerStatus(status);
  };

  if (isLoading) return <View className="flex-1 justify-center"><ActivityIndicator size="large" color="#4f46e5" /></View>;

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 40 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 10, marginLeft: -15 }}>
          <SymbolView name="chevron.left" size={24} tintColor="#0f172a" />
        </TouchableOpacity>
        
        <View style={{ flex: 1, marginLeft: 5 }}>
          <Text style={[styles.title, { marginBottom: 0, textAlign: 'left', fontSize: 20 }]}>
            {eventInfo.type === 'match' ? `Match vs ${eventInfo.opponent}` : 'Training Session'}
          </Text>
          <Text style={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>
            {eventInfo.dateStr}
          </Text>
        </View>
      </View>

      <View className="flex-row bg-slate-200 p-1 rounded-xl mb-6">
        <Pressable onPress={() => setActiveTab('attendance')} className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'attendance' ? 'bg-white' : ''}`}>
          <Text className="font-bold">Attendance</Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab('review')} className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'review' ? 'bg-white' : ''}`}>
          <Text className="font-bold">Review</Text>
        </Pressable>
      </View>

      {activeTab === 'attendance' ? (
        <AttendanceView 
          role={currentUserRole || 'player'} 
          stats={attendanceStats} 
          playerStatus={playerStatus} 
          hasEventPassed={hasEventPassed} 
          onRSVP={handleRSVP} 
        />
      ) : (
        currentUserRole === 'player' ? (
          isSubmitted ? (
            <View className="items-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
               <Text className="text-4xl mb-4">✅</Text>
               <Text className="text-xl font-bold text-slate-900">Review Submitted</Text>
               <Text className="text-slate-500 mt-2">Thanks for your feedback!</Text>
            </View>
          ) : (
            <ReviewForm eventId={eventId} onSuccess={() => setIsSubmitted(true)} />
          )
        ) : (
          /* Updated CoachSummary with correct props because the event info is now available, ohyh*/
          <CoachSummary 
            summary={eventInfo.summary} 
            responseCount={responseCount} 
            attendingCount={attendanceStats.attending} 
            isLoading={false} 
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
});