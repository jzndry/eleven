import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { getCurrentUser } from '@/services/auth';
import { getRoleAndTeam, getTeamPlayerCount } from '@/services/profiles';
import { getNextEvent } from '@/services/events';
import { getEventAttendanceStatuses, getPlayerAttendanceStatus, summarizeAttendance } from '@/services/attendance';
import type { Event, Role } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State for Role and Team
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [teamSize, setTeamSize] = useState(0);

  // State for Next Event
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [eventStats, setEventStats] = useState({ attending: 0, declined: 0, no_response: 0 });
  const [playerRSVP, setPlayerRSVP] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // 1. Get User Profile & Role
      const profile = await getRoleAndTeam(user.id);
      if (!profile) return;
      setUserRole(profile.role);

      // 2. Get Squad Size (All players in that team)
      const count = await getTeamPlayerCount(profile.team_id || '');
      setTeamSize(count);

      // 3. Get the NEXT single event (closest in the future)
      const event = await getNextEvent(profile.team_id || '');

      if (event) {
        setNextEvent(event);

        if (profile.role === 'coach') {
          // Fetch coach-specific stats for the event
          const attData = await getEventAttendanceStatuses(event.id);
          const { attending, declined, no_response } = summarizeAttendance(attData, count);
          setEventStats({ attending, declined, no_response });
        } else {
          // Check if this specific player has RSVP'd
          const rsvp = await getPlayerAttendanceStatus(event.id, user.id);
          setPlayerRSVP(rsvp);
        }
      } else {
        setNextEvent(null);
      }
    } catch (e) {
      console.error('Dashboard Fetch Error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator color="#4f46e5" size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="px-6 pt-16 pb-20">
        {/* Role-Based Title */}
        <Text className="text-3xl font-black text-slate-900 mb-1">
          {userRole === 'coach' ? 'Coach Dashboard' : 'Player Dashboard'}
        </Text>
        <Text className="text-slate-500 mb-8 font-medium">All the information you need at a glance.</Text>

        {/* Next Event Section */}
        <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest ml-1 mb-3">Upcoming Event</Text>

        {nextEvent ? (
          <TouchableOpacity
            onPress={() => router.push(`/(tabs)/event-review/${nextEvent.id}`)}
            activeOpacity={0.8}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8"
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className={`px-3 py-1 rounded-full ${nextEvent.event_type === 'match' ? 'bg-amber-100' : 'bg-indigo-100'}`}>
                <Text className={`font-bold text-[10px] uppercase ${nextEvent.event_type === 'match' ? 'text-amber-700' : 'text-indigo-700'}`}>
                  {nextEvent.event_type}
                </Text>
              </View>
              <SymbolView name="chevron.right" size={18} tintColor="#cbd5e1" />
            </View>

            <Text className="text-2xl font-bold text-slate-900 mb-1">
              {nextEvent.event_type === 'match' ? `Match vs ${nextEvent.opponent || 'TBC'}` : 'Training Session'}
            </Text>

            <View className="flex-row items-center mb-6">
              <SymbolView name="calendar" size={14} tintColor="#64748b" />
              <Text className="text-slate-500 ml-1 mr-4">{new Date(nextEvent.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
              <SymbolView name="mappin.and.ellipse" size={14} tintColor="#64748b" />
              <Text className="text-slate-500 ml-1">{nextEvent.location || 'TBC'}</Text>
            </View>

            {/* Role-Specific Stats Footer */}
            <View className="pt-4 border-t border-slate-50">
              {userRole === 'coach' ? (
                <View className="flex-row justify-between px-2">
                  <View className="items-center">
                    <Text className="text-green-600 font-bold text-lg">{eventStats.attending}</Text>
                    <Text className="text-slate-400 text-[10px] uppercase font-bold">Going</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-red-600 font-bold text-lg">{eventStats.declined}</Text>
                    <Text className="text-slate-400 text-[10px] uppercase font-bold">Out</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-slate-500 font-bold text-lg">{eventStats.no_response}</Text>
                    <Text className="text-slate-400 text-[10px] uppercase font-bold">Pending</Text>
                  </View>
                </View>
              ) : (
                <View className="flex-row items-center justify-center py-1">
                  <SymbolView
                    name={playerRSVP ? "checkmark.circle.fill" : "exclamationmark.circle.fill"}
                    size={18}
                    tintColor={playerRSVP ? "#15803d" : "#b45309"}
                  />
                  <Text className={`ml-2 font-bold ${playerRSVP ? 'text-green-700' : 'text-amber-700'}`}>
                    {playerRSVP ? `You've responded: ${playerRSVP}` : "Action required: Submit your attendance"}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 items-center mb-8">
            <Text className="text-slate-400 font-medium">No upcoming events found.</Text>
          </View>
        )}

        {/* Squad Size Stats */}
        <View className="bg-indigo-600 p-6 rounded-3xl shadow-lg flex-row justify-between items-center">
          <View>
            <Text className="text-indigo-200 font-bold text-xs uppercase tracking-widest mb-1">Current Roster</Text>
            <Text className="text-white text-3xl font-black">{teamSize} Players</Text>
          </View>
          <View className="bg-white/20 p-4 rounded-2xl">
            <SymbolView name="person.3.fill" size={28} tintColor="white" />
          </View>
        </View>

      </View>
    </ScrollView>
  );
}
