import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase'; // Adjusted path to go up two levels

export default function TabOneScreen() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return (
    <ScrollView 
      className="flex-1 bg-white"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchProfiles();}} />
      }
    >
      <View className="p-6 pt-12">
        <Text className="text-3xl font-extrabold text-slate-900 mb-8">Coach Dashboard</Text>

        {/* Placeholder for AI logic - Used as confirmation that we are connected to the cloud */}
        <View className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 mb-6">
          <Text className="text-indigo-900 font-bold text-lg mb-1">AI Status</Text>
          <Text className="text-indigo-700">
            {loading ? "Analysing database..." : `connected to the cloud. ${profiles.length} profiles found (ALL IN DB).`}
          </Text>
        </View>

        {/* Statistics Row */}
        <View className="flex-row justify-between mb-8">
          <View className="bg-slate-50 p-4 rounded-2xl w-[48%] border border-slate-100">
            <Text className="text-slate-500 text-s">Total Players</Text>
            <Text className="text-2xl font-bold text-slate-900">{profiles.length}</Text>
          </View>
          <View className="bg-slate-50 p-4 rounded-2xl w-[48%] border border-slate-100">
            <Text className="text-slate-500 text-s">Active Events</Text>
            <Text className="text-2xl font-bold text-slate-900">0</Text>
          </View>
        </View>

        <TouchableOpacity 
          className="bg-slate-900 p-5 rounded-2xl items-center shadow-sm"
          onPress={() => alert('To be implemented lol soon')} 
        >
          <Text className="text-white font-bold">Create New Training Session</Text>
        </TouchableOpacity>

        {loading && !refreshing && <ActivityIndicator className="mt-10" size="large" color="#000" />}
      </View>
    </ScrollView>
  );
}