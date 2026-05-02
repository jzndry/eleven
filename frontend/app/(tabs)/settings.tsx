import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  TextInput, Alert, ActivityIndicator 
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Toggle states for editing modes
  const [isEditingTeamData, setIsEditingTeamData] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  
  // Core Data
  const [profile, setProfile] = useState({ full_name: '', role: '', position: '' });
  const [team, setTeam] = useState({ id: '', name: '', home_address: '', training_address: '' });

  // Temporary state for editing personal details
  const [tempProfile, setTempProfile] = useState({ full_name: '', position: '' });

  useEffect(() => { fetchInitialData(); }, []);

  async function fetchInitialData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profileData) {
      setProfile(profileData);
      setTempProfile({ full_name: profileData.full_name, position: profileData.position || '' });
    }

    if (profileData?.role === 'coach') {
      const { data: teamData } = await supabase.from('teams').select('*').eq('coach_id', user.id).single();
      if (teamData) setTeam(teamData);
    }
    setLoading(false);
  }

  const handleUpdateTeam = async () => {
    setLoading(true);
    const { error } = await supabase.from('teams').update({
      name: team.name,
      home_address: team.home_address,
      training_address: team.training_address
    }).eq('id', team.id);

    if (!error) {
      Alert.alert("Success", "Team settings updated.");
      setIsEditingTeamData(false);
    }
    setLoading(false);
  };

  const handleUpdatePersonal = async () => {
    if (!tempProfile.full_name.trim()) return Alert.alert("Error", "Name cannot be empty.");
    
    setLoading(true);
    const updates = {
      full_name: tempProfile.full_name.trim(),
      ...(profile.role === 'player' ? { position: tempProfile.position.trim() } : {})
    };

    const { error } = await supabase.from('profiles').update(updates).eq('id', (await supabase.auth.getUser()).data.user?.id);

    if (!error) {
      setProfile({ ...profile, ...updates });
      setIsEditingPersonal(false);
      Alert.alert("Success", "Personal profile updated.");
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you absolutely sure? This will permanently delete your profile and team data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Permanently", style: "destructive", onPress: () => handleSignOut() }
      ]
    );
  };

  if (loading && !isEditingTeamData && !isEditingPersonal) return <ActivityIndicator className="flex-1" color="#4f46e5" />;

  return (
    <ScrollView className="flex-1 bg-slate-50 p-6">
      <Text className="text-3xl font-bold text-slate-900 mb-8 mt-10">Settings</Text>
      
      <TouchableOpacity onPress={handleSignOut} className="bg-white p-5 rounded-3xl mb-4 border border-slate-100">
        <Text className="text-center font-bold text-slate-700">Sign Out</Text>
      </TouchableOpacity>

      {/* --- TEAM SETTINGS (Coach Only) --- */}
      {profile.role === 'coach' && (
        <View className="mb-8">
          <Text className="text-slate-400 font-bold mb-4 uppercase text-xs tracking-widest">Team Management</Text>
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            {!isEditingTeamData ? (
              <TouchableOpacity onPress={() => setIsEditingTeamData(true)} className="flex-row justify-between items-center">
                <View>
                  <Text className="text-lg font-bold text-slate-800">{team.name || 'Set Team Name'}</Text>
                  <Text className="text-slate-500 text-xs">Manage addresses and name</Text>
                </View>
                <SymbolView name="pencil.circle.fill" size={24} tintColor="#4f46e5" />
              </TouchableOpacity>
            ) : (
              <View>
                <TextInput className="bg-slate-50 p-4 rounded-xl mb-3" placeholder="Team Name" value={team.name} onChangeText={(t) => setTeam({...team, name: t})} />
                <TextInput className="bg-slate-50 p-4 rounded-xl mb-3" placeholder="Home Ground Address" value={team.home_address} onChangeText={(t) => setTeam({...team, home_address: t})} />
                <TextInput className="bg-slate-50 p-4 rounded-xl mb-4" placeholder="Training Address" value={team.training_address} onChangeText={(t) => setTeam({...team, training_address: t})} />
                <View className="flex-row space-x-2">
                  <TouchableOpacity onPress={handleUpdateTeam} className="flex-1 bg-indigo-600 p-3 rounded-xl"><Text className="text-white text-center font-bold">Save</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsEditingTeamData(false)} className="flex-1 bg-slate-100 p-3 rounded-xl"><Text className="text-slate-600 text-center font-bold">Cancel</Text></TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* --- PERSONAL PROFILE (Coach & Player) --- */}

      
      <View className="mb-8">
        <Text className="text-slate-400 font-bold mb-4 uppercase text-xs tracking-widest">Personal Profile</Text>
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          {!isEditingPersonal ? (
            <View>
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-slate-400 text-[10px] uppercase font-bold mb-1">Display Name</Text>
                  <Text className="text-lg text-slate-800 font-semibold">{profile.full_name}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsEditingPersonal(true)}>
                  <SymbolView name="pencil" size={18} tintColor="#4f46e5" />
                </TouchableOpacity>
              </View>
              {profile.role === 'player' && (
                <View className="mb-4">
                  <Text className="text-slate-400 text-[10px] uppercase font-bold mb-1">Position</Text>
                  <Text className="text-lg text-slate-800 font-semibold">{profile.position || 'Not set'}</Text>
                </View>
              )}
            </View>
          ) : (
            <View>
              <Text className="text-slate-400 text-[10px] uppercase font-bold mb-1">Full Name</Text>
              <TextInput className="bg-slate-50 p-4 rounded-xl mb-3" value={tempProfile.full_name} onChangeText={(t) => setTempProfile({...tempProfile, full_name: t})} />
              {profile.role === 'player' && (
                <>
                  <Text className="text-slate-400 text-[10px] uppercase font-bold mb-1">Position</Text>
                  <TextInput className="bg-slate-50 p-4 rounded-xl mb-4" value={tempProfile.position} onChangeText={(t) => setTempProfile({...tempProfile, position: t})} />
                </>
              )}
              <View className="flex-row space-x-2 mb-4">
                <TouchableOpacity onPress={handleUpdatePersonal} className="flex-1 bg-indigo-600 p-3 rounded-xl"><Text className="text-white text-center font-bold">Save</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditingPersonal(false)} className="flex-1 bg-slate-100 p-3 rounded-xl"><Text className="text-slate-600 text-center font-bold">Cancel</Text></TouchableOpacity>
              </View>
            </View>
          )}
          
          <TouchableOpacity onPress={() => Alert.alert("Password Reset", "A reset link has been sent to your email.")} className="flex-row items-center py-3 border-t border-slate-50">
            <SymbolView name="lock.fill" size={18} tintColor="#64748b" />
            <Text className="ml-3 text-slate-700 font-medium">Change Password</Text>
          </TouchableOpacity>
        </View>
      </View>


      <TouchableOpacity onPress={confirmDeleteAccount} className="bg-white rounded-3xl border border-slate-100 p-5 mb-20">
        <Text className="text-center font-bold text-red-500">Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}