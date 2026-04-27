import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

export default function ScheduleScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // 1. Get the current coach's team_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (profile?.team_id) {
        // 2. Fetch only events for THIS team
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('team_id', profile.team_id)
          .order('event_date', { ascending: true });
        
        if (!error) setEvents(data || []);
      }
    } catch (err) {
      console.error("Error fetching schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const renderEvent = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/event-review/${item.id}`)}
      activeOpacity={0.7}
      className="bg-white p-5 mb-4 rounded-3xl shadow-sm border border-slate-100"
    >
      <View className="flex-row justify-between items-center mb-2">
        <View className={`px-3 py-1 rounded-full ${item.event_type === 'match' ? 'bg-amber-100' : 'bg-indigo-100'}`}>
          <Text className={`text-[10px] font-bold uppercase ${item.event_type === 'match' ? 'text-amber-700' : 'text-indigo-700'}`}>
            {item.event_type}
          </Text>
        </View>
        <SymbolView name="chevron.right" size={14} tintColor="#cbd5e1" />
      </View>
      
      <Text className="text-xl font-bold text-slate-900 mb-1">
        {item.event_type === 'match' ? 'Match Day' : 'Training Session'}
      </Text>
      
      <View className="flex-row items-center mt-3">
        <SymbolView name="calendar" size={14} tintColor="#64748b" />
        <Text className="text-slate-500 text-sm ml-1 mr-4">
          {new Date(item.event_date).toLocaleDateString('en-GB')}
        </Text>
        <SymbolView name="mappin.and.ellipse" size={14} tintColor="#64748b" />
        <Text className="text-slate-500 text-sm ml-1">{item.location || 'TBC'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-50 p-4">
      {loading ? (
        <ActivityIndicator color="#4f46e5" size="large" className="mt-10" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-slate-400">No upcoming events found.</Text>
            </View>
          }
        />
      )}
      
      <TouchableOpacity 
        className="absolute bottom-6 right-6 h-14 w-14 bg-indigo-600 rounded-2xl items-center justify-center shadow-xl"
        onPress={() => alert("Add Event Form coming next!")}
      >
        <SymbolView name="plus" size={22} tintColor="white" />
      </TouchableOpacity>
    </View>
  );
}