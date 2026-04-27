import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator, 
  DimensionValue, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView, 
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase'; 
import Slider from '@react-native-community/slider';

export default function EventHubScreen() {
  const { id } = useLocalSearchParams();
  const eventId = typeof id === 'string' ? id : id[0];
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // 1. Core UI State
  const [activeTab, setActiveTab] = useState('attendance'); 
  const [isLoading, setIsLoading] = useState(true);
  
  // 2. Data State
  const [currentUserRole, setCurrentUserRole] = useState<'player' | 'coach' | null>(null);
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [hasEventPassed, setHasEventPassed] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({ attending: 0, declined: 0, no_response: 0, total: 0 });
  const [playerStatus, setPlayerStatus] = useState<string | null>(null); 

  // 3. Review Form State
  const [reviewForm, setReviewForm] = useState({
    team_play: 5,
    personal_perf: 5,
    improvements: '',
    comments: ''
  });

  useEffect(() => {
    if (eventId) fetchHubData();
  }, [eventId]);

  async function fetchHubData() {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, team_id')
        .eq('id', user.id)
        .single();

      if (profile) setCurrentUserRole(profile.role as 'player' | 'coach');

      const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (event) {
        const eDate = new Date(event.event_date);
        setEventDate(eDate);
        setHasEventPassed(eDate < new Date());
        
        if (profile?.role === 'coach') {
          await fetchCoachStats(event.id, event.team_id);
        } else {
          await fetchPlayerStatus(event.id, user.id);
        }
      }
    } catch (error) {
      console.error("Error loading hub data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCoachStats(evId: string, teamId: string) {
    const { count: totalPlayers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('team_id', teamId)
      .eq('role', 'player');

    const { data: rsvps } = await supabase
      .from('event_attendance')
      .select('status')
      .eq('event_id', evId);

    let attending = 0;
    let declined = 0;

    rsvps?.forEach(rsvp => {
      if (rsvp.status === 'attending') attending++;
      if (rsvp.status === 'declined') declined++;
    });

    const total = totalPlayers || 0;
    const no_response = total - (attending + declined);
    setAttendanceStats({ attending, declined, no_response, total });
  }

  async function fetchPlayerStatus(evId: string, userId: string) {
    const { data: myRsvp } = await supabase
      .from('event_attendance')
      .select('status')
      .eq('event_id', evId)
      .eq('player_id', userId)
      .single();

    if (myRsvp) setPlayerStatus(myRsvp.status);
  }

  async function handleRSVP(newStatus: 'attending' | 'declined') {
    if (hasEventPassed) return; 
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('event_attendance')
      .upsert({ 
        event_id: eventId, 
        player_id: user.id, 
        status: newStatus 
      }, { onConflict: 'event_id, player_id' });

    if (!error) {
      setPlayerStatus(newStatus); 
    } else {
      console.error("Failed to save RSVP:", error);
    }
  }

  // --- SUB-COMPONENTS ---

  const TabToggle = () => (
    <View style={styles.toggleContainer} className="flex-row bg-slate-200 p-1 rounded-xl mb-6">
      <Pressable 
        onPress={() => setActiveTab('attendance')}
        className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'attendance' ? 'bg-white shadow-sm' : ''}`}
      >
        <Text className={`font-bold ${activeTab === 'attendance' ? 'text-blue-600' : 'text-slate-500'}`}>Attendance</Text>
      </Pressable>
      <Pressable 
        onPress={() => setActiveTab('review')}
        className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'review' ? 'bg-white shadow-sm' : ''}`}
      >
        <Text className={`font-bold ${activeTab === 'review' ? 'text-blue-600' : 'text-slate-500'}`}>Review</Text>
      </Pressable>
    </View>
  );

  const PlayerAttendanceView = () => (
    <View className="items-center mt-4">
      {hasEventPassed && (
        <View className="bg-slate-100 px-4 py-2 rounded-full mb-4">
          <Text className="text-slate-500 font-semibold">Event has passed - Attendance locked</Text>
        </View>
      )}
      <View className="w-full space-y-3">
        <TouchableOpacity 
          disabled={hasEventPassed}
          onPress={() => handleRSVP('attending')}
          className={`py-4 rounded-xl items-center ${
            hasEventPassed ? 'bg-slate-200' : playerStatus === 'attending' ? 'bg-green-600 border-2 border-green-800' : 'bg-green-500'
          }`}
        >
          <Text className="font-bold text-lg text-white">
            {playerStatus === 'attending' ? '✓ Attending' : 'Attending'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          disabled={hasEventPassed}
          onPress={() => handleRSVP('declined')}
          className={`py-4 rounded-xl items-center ${
            hasEventPassed ? 'bg-slate-200' : playerStatus === 'declined' ? 'bg-red-600 border-2 border-red-800' : 'bg-red-500'
          }`}
        >
          <Text className="font-bold text-lg text-white">
             {playerStatus === 'declined' ? '✓ Declined' : 'Declined'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const CoachAttendanceView = () => {
    const total = attendanceStats.total || 1;
    const attendingWidth = `${(attendanceStats.attending / total) * 100}%`;
    const declinedWidth = `${(attendanceStats.declined / total) * 100}%`;
    const noResponseWidth = `${(attendanceStats.no_response / total) * 100}%`;

    return (
      <View className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <Text className="font-bold text-lg mb-4 text-slate-800">Squad Availability</Text>
        <View className="h-4 flex-row w-full rounded-full overflow-hidden mb-6">
          <View style={{ width: attendingWidth as DimensionValue }} className="bg-green-500" />
          <View style={{ width: declinedWidth as DimensionValue }} className="bg-red-500" />
          <View style={{ width: noResponseWidth as DimensionValue }} className="bg-slate-300" />
        </View>
        <View className="flex-row justify-between px-2">
          <View className="items-center"><Text className="text-green-600 font-bold text-xl">{attendanceStats.attending}</Text><Text className="text-slate-500 text-xs uppercase">Attending</Text></View>
          <View className="items-center"><Text className="text-red-600 font-bold text-xl">{attendanceStats.declined}</Text><Text className="text-slate-500 text-xs uppercase">Declined</Text></View>
          <View className="items-center"><Text className="text-slate-600 font-bold text-xl">{attendanceStats.no_response}</Text><Text className="text-slate-500 text-xs uppercase">No Reply</Text></View>
        </View>
      </View>
    );
  };

  const PlayerReviewView = () => {
  if (isSubmitted) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <View className="bg-green-100 p-6 rounded-full mb-6">
          {/* Using a fallback icon in case SymbolView is still acting up */}
          <Text className="text-5xl">✅</Text>
        </View>
        <Text className="text-2xl font-black text-slate-900 mb-2">Review Submitted!</Text>
        <Text className="text-slate-500 text-center px-10">
          Thank you for your feedback. Your coach will see the summary shortly.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
      style={{ flex: 1 }} // CRITICAL: Ensures the keyboard view fills the screen
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 40 }} // Adds space at the bottom
        showsVerticalScrollIndicator={false}
      >
        <View className="py-4">
          <Text className="text-slate-800 font-bold text-lg mb-6">Match Questionnaire</Text>

          {/* 1. Team Performance */}
          <View className="mb-8">
            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-600 font-semibold">Team Performance</Text>
              <Text className="text-blue-600 font-black">{reviewForm.team_play}/10</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1} maximumValue={10} step={1}
              value={reviewForm.team_play}
              onValueChange={(val) => setReviewForm({ ...reviewForm, team_play: val })}
              minimumTrackTintColor="#2563eb" maximumTrackTintColor="#cbd5e1"
            />
          </View>

          {/* 2. Personal Performance */}
          <View className="mb-8">
            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-600 font-semibold">Personal Performance</Text>
              <Text className="text-blue-600 font-black">{reviewForm.personal_perf}/10</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1} maximumValue={10} step={1}
              value={reviewForm.personal_perf}
              onValueChange={(val) => setReviewForm({ ...reviewForm, personal_perf: val })}
              minimumTrackTintColor="#2563eb" maximumTrackTintColor="#cbd5e1"
            />
          </View>

          {/* 3. Text Inputs */}
          <Text className="text-slate-600 font-semibold mb-2">Any improvements for team?</Text>
          <TextInput
            multiline
            numberOfLines={3}
            autoCorrect={false}
            spellCheck={false}
            className="bg-white p-4 rounded-xl border border-slate-200 mb-6 text-slate-900 min-h-[100px]"
            placeholder="Share your thoughts..."
            value={reviewForm.improvements}
            onChangeText={(t) => setReviewForm({ ...reviewForm, improvements: t })}
          />

          <Text className="text-slate-600 font-semibold mb-2">Other comments</Text>
          <TextInput
            multiline
            numberOfLines={3}
            autoCorrect={false}
            spellCheck={false}
            className="bg-white p-4 rounded-xl border border-slate-200 mb-8 text-slate-900 min-h-[100px]"
            placeholder="Anything else?"
            value={reviewForm.comments}
            onChangeText={(t) => setReviewForm({ ...reviewForm, comments: t })}
          />

          <TouchableOpacity 
            className="bg-blue-600 p-5 rounded-2xl items-center shadow-lg"
            onPress={() => setIsSubmitted(true)}
          >
            <Text className="text-white font-bold text-lg">Submit Review</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

  
  // --- MAIN RENDER ---
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event Hub</Text>
      <Text style={styles.subtitle}>{eventDate?.toLocaleDateString('en-GB')}</Text>

      <TabToggle />

      {activeTab === 'attendance' ? (
        currentUserRole === 'coach' ? <CoachAttendanceView /> : <PlayerAttendanceView />
      ) : (
        currentUserRole === 'player' ? (
          <PlayerReviewView />
        ) : (
          <View className="bg-slate-50 p-10 rounded-2xl border border-dashed border-slate-300 items-center">
            <Text className="text-slate-400 text-center">Coach review summary will appear here once players have submitted feedback.</Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  toggleContainer: { elevation: 2 }, 
});