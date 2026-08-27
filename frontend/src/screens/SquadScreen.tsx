import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '@/services/supabase';
import { SymbolView } from 'expo-symbols';
import { useRouter, useFocusEffect } from 'expo-router';

export default function TeamScreen() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState<string>('Your Squad');
  const router = useRouter();

  const fetchSquad = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (profile?.team_id) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('team_name')
          .eq('id', profile.team_id)
          .single();
        
        if (teamData) setTeamName(teamData.team_name);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('team_id', profile.team_id)
          .eq('role', 'player')
          .order('full_name');

        if (!error) setPlayers(data || []);
      }
    } catch (err) {
      console.error("Error fetching squad:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSquad();
    }, [])
  );

  return (
    <View className="flex-1 bg-slate-50 p-4">
      <View className="mb-6 mt-2">
        <Text className="text-2xl font-bold text-slate-900">{teamName}</Text>
        <Text className="text-slate-500 font-medium">{players.length} Players Enrolled</Text>
      </View>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => router.push(`/player/${item.id}`)}
            className="bg-white p-4 mb-2 rounded-2xl flex-row items-center shadow-sm border border-slate-100"
          >
            <View className="h-12 w-12 bg-indigo-100 rounded-full items-center justify-center mr-4">
              <Text className="text-indigo-700 font-bold text-lg">{item.full_name?.charAt(0)}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-900 text-base">{item.full_name}</Text>
              <Text className="text-slate-500 text-xs uppercase tracking-wider font-semibold">{item.position || 'Unassigned'}</Text>
            </View>
            <SymbolView name="chevron.right" size={14} tintColor="#cbd5e1" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? (
          <View className="items-center mt-20">
            <Text className="text-slate-400">No players found for this team.</Text>
          </View>
        ) : null}
      />
      {loading && <ActivityIndicator className="mt-4" color="#4f46e5" />}
    </View>
  );
}