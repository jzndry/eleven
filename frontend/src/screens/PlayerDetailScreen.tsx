import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { SymbolView } from 'expo-symbols';

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<'coach' | 'player' | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Get the current logged-in user's role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: viewerProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (viewerProfile) setCurrentUserRole(viewerProfile.role as 'coach' | 'player');
      }

      // 2. Get the details of the player profile being viewed
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setPlayer(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async () => {
    Alert.alert(
      "Remove Player",
      `Are you sure you want to remove ${player?.full_name} from the squad?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // We set team_id to null instead of deleting the profile entirely
              // Need to add some fix to a hanging player profile if we want to re-add them to a team in the future
              const { error } = await supabase
                .from('profiles')
                .update({ team_id: null })
                .eq('id', id);
              
              if (error) throw error;
              
              Alert.alert("Success", "Player removed from the team.");
              router.back();
            } catch (err: any) {
              Alert.alert("Error", err.message);
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!player) return null;

  return (
    <View className="flex-1 bg-slate-50 p-6">
      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        className="mb-8 mt-12 flex-row items-center"
      >
        <SymbolView name="chevron.left" size={24} tintColor="#4f46e5" />
        <Text className="text-indigo-600 font-bold ml-2 text-lg">Back to Team</Text>
      </TouchableOpacity>

      {/* Profile Header */}
      <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 items-center mb-8">
        <View className="h-20 w-20 bg-indigo-100 rounded-full items-center justify-center mb-4">
          <Text className="text-indigo-700 font-bold text-3xl">{player.full_name?.charAt(0)}</Text>
        </View>
        <Text className="text-2xl font-bold text-slate-900 mb-1">{player.full_name}</Text>
        <Text className="text-slate-500 font-semibold uppercase tracking-widest">{player.position || 'Unassigned'}</Text>
      </View>

      {/* Info Card */}
      <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
        <Text className="text-slate-400 text-[10px] uppercase font-bold mb-1">Date Joined</Text>
        <Text className="text-lg text-slate-800 font-semibold">
          {new Date(player.created_at).toLocaleDateString('en-GB')}
        </Text>
      </View>

      {/* Little Action Section */}
      {currentUserRole === 'coach' && (
        <TouchableOpacity 
          onPress={handleRemovePlayer} 
          className="bg-red-50 p-5 rounded-2xl border border-red-100 flex-row justify-center items-center mt-4"
        >
          <SymbolView name="person.crop.circle.badge.minus" size={20} tintColor="#ef4444" />
          <Text className="ml-2 font-bold text-red-500 text-lg">Remove from Squad</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}