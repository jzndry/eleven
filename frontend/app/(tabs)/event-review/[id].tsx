import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router'; // Added useRouter
import { supabase } from '../../../lib/supabase'; 
import { SymbolView } from 'expo-symbols'; // Added for the back icon

// Split components for better organisation
import { AttendanceView } from '../../../components/AttendanceView';
import { ReviewForm } from '../../../components/ReviewForm';
import { CoachSummary } from '../../../components/CoachSummary';

export default function EventHubScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter(); // Initialised router
  const eventId = typeof id === 'string' ? id : id[0];
  const [activeTab, setActiveTab] = useState('attendance'); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<'player' | 'coach' | null>(null);
  
  // Minimal state addition to hold event info for the title
  const [eventInfo, setEventInfo] = useState({ type: '', opponent: '', dateStr: '' });
  
  const [hasEventPassed, setHasEventPassed] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({ attending: 0, declined: 0, no_response: 0, total: 0 });
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
        // Setting event info for our dynamic title
        setEventInfo({
          type: event.event_type,
          opponent: event.opponent || '',
          dateStr: new Date(event.event_date).toLocaleDateString('en-GB', { 
            weekday: 'short', day: 'numeric', month: 'short' 
          })
        });
        setHasEventPassed(new Date(event.event_date) < new Date());
        if (profile?.role === 'coach') await fetchCoachStats(event.id, event.team_id);
        else await fetchPlayerStatus(event.id, user.id);
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }

  async function fetchCoachStats(evId: string, teamId: string) {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact' }).eq('team_id', teamId).eq('role', 'player');
    const { data } = await supabase.from('event_attendance').select('status').eq('event_id', evId);
    let att = 0; let dec = 0;
    data?.forEach(r => { if(r.status === 'attending') att++; if(r.status === 'declined') dec++; });
    setAttendanceStats({ attending: att, declined: dec, no_response: (count || 0) - (att + dec), total: count || 0 });
  }

  async function fetchPlayerStatus(evId: string, userId: string) {
    const { data } = await supabase.from('event_attendance').select('status').eq('event_id', evId).eq('player_id', userId).single();
    if (data) setPlayerStatus(data.status);
  }

  const handleRSVP = async (status: 'attending' | 'declined') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('event_attendance').upsert({ event_id: eventId, player_id: user.id, status }, { onConflict: 'event_id, player_id' });
    setPlayerStatus(status);
  };

  if (isLoading) return <View className="flex-1 justify-center"><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <View style={styles.container}>
      {/* Header Row: Keeps styles.title but adds back button and dynamic text */}
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
        <AttendanceView role={currentUserRole || 'player'} stats={attendanceStats} playerStatus={playerStatus} hasEventPassed={hasEventPassed} onRSVP={handleRSVP} />
      ) : (
        currentUserRole === 'player' ? (
          isSubmitted ? <View className="items-center py-20"><Text className="text-2xl font-black">Success! ✅</Text></View> : <ReviewForm eventId={eventId} onSuccess={() => setIsSubmitted(true)} />
        ) : <CoachSummary />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
});