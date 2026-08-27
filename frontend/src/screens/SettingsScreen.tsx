import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  TextInput, Alert, ActivityIndicator 
} from 'react-native';
import { supabase } from '@/services/supabase';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  
  const [profile, setProfile] = useState({ full_name: '', role: '', position: '', email: '' });
  const [team, setTeam] = useState({ id: '', name: '', home_address: '', training_address: '', join_code: '' });
  const [tempValue, setTempValue] = useState('');

  useEffect(() => { fetchInitialData(); }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, role, position, team_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({ ...profileData, email: user.email || '' });
      }

      if (profileData?.role === 'coach') {
        let { data: teamData } = await supabase
          .from('teams')
          .select('id, team_name, home_ground_address, training_ground_address, join_code') // ADDED join_code
          .eq('coach_id', user.id)
          .maybeSingle();

        if (!teamData && profileData.team_id) {
          const { data: fallbackTeam } = await supabase
            .from('teams')
            .select('id, team_name, home_ground_address, training_ground_address, join_code') // ADDED join_code
            .eq('id', profileData.team_id)
            .maybeSingle();
          teamData = fallbackTeam;
        }

        if (teamData) {
          setTeam({
            id: teamData.id, 
            name: teamData.team_name || '',
            home_address: teamData.home_ground_address || '',
            training_address: teamData.training_ground_address || '',
            join_code: teamData.join_code || '', // STORE join_code
          });
        }
      }
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    console.log("Join code copied to clipboard:", text);
  };

  const updateField = async (fieldName: string) => {
    if (!tempValue.trim()) return setEditingField(null);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (fieldName === 'email') {
        const { error } = await supabase.auth.updateUser({ email: tempValue.trim() });
        if (error) throw error;
        Alert.alert("Confirm Email", "Check both your old and new emails to finalise changes.");
      } 
      else if (fieldName === 'team_name' || fieldName === 'home_address' || fieldName === 'training_address') {
        if (!team.id) {
          throw new Error("Team ID is missing. Please ensure your team was created correctly.");
        }

        let dbField = fieldName;
        if (fieldName === 'home_address') dbField = 'home_ground_address';
        if (fieldName === 'training_address') dbField = 'training_ground_address';

        const { error } = await supabase
          .from('teams')
          .update({ [dbField]: tempValue.trim() })
          .eq('id', team.id);
        
        if (error) throw error;
        
        if (fieldName === 'team_name') setTeam(prev => ({ ...prev, name: tempValue.trim() }));
        else setTeam(prev => ({ ...prev, [fieldName]: tempValue.trim() }));
      } 
      else {
        const { error } = await supabase
          .from('profiles')
          .update({ [fieldName]: tempValue.trim() })
          .eq('id', user?.id);
        
        if (error) throw error;
        setProfile(prev => ({ ...prev, [fieldName]: tempValue.trim() }));
      }
      setEditingField(null);
    } catch (error: any) {
      Alert.alert("Update Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
      Alert.alert("Account Deleted", "Your data has been successfully removed.");
      handleSignOut();
    } catch (error: any) {
      Alert.alert("Delete Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Wait! Are you sure?",
      "\nThis action is permanent. Deleting your account will remove all your data, team associations, and progress.\n \n",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Delete My Account", onPress: handleDeleteAccount, style: "destructive" },
      ],
      { cancelable: true }
    );
  };

  const SettingRow = ({ label, value, fieldName }: { label: string, value: string, fieldName: string }) => {
    const isEditing = editingField === fieldName;
    return (
      <View className="py-4 border-b border-slate-50 last:border-0">
        <Text className="text-slate-400 text-[10px] uppercase font-bold mb-1">{label}</Text>
        <View className="flex-row justify-between items-center h-8">
          {isEditing ? (
            <TextInput 
              autoFocus
              className="flex-1 text-lg text-indigo-600 font-semibold p-0"
              value={tempValue}
              onChangeText={setTempValue}
              onBlur={() => setEditingField(null)}
              onSubmitEditing={() => updateField(fieldName)}
            />
          ) : (
            <Text className="text-lg text-slate-800 font-semibold" numberOfLines={1}>
              {value || 'Not set'}
            </Text>
          )}
          <TouchableOpacity onPress={() => {
            if (isEditing) {
              updateField(fieldName);
            } else {
              setTempValue(value || '');
              setEditingField(fieldName);
            }
          }}>
            <SymbolView 
              name={isEditing ? "checkmark.circle.fill" : "pencil"} 
              size={18} 
              tintColor={isEditing ? "#10b981" : "#4f46e5"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 p-6">
      
      <TouchableOpacity onPress={handleSignOut} className="bg-white p-5 rounded-3xl mb-8 border border-slate-100 shadow-sm flex-row justify-center items-center">
        <SymbolView name="rectangle.portrait.and.arrow.right" size={18} tintColor="#64748b" />
        <Text className="ml-2 font-bold text-slate-700">Sign Out</Text>
      </TouchableOpacity>

      {profile.role === 'coach' && (
        <View className="mb-8">
          <Text className="text-slate-400 font-bold mb-4 uppercase text-xs tracking-widest">Team Management</Text>
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
             <SettingRow label="Team Name" value={team.name} fieldName="team_name" /> 
             <SettingRow label="Home Ground" value={team.home_address} fieldName="home_address" /> 
             <SettingRow label="Training Ground" value={team.training_address} fieldName="training_address" /> 
             
             {/* NEW: Join Code Copy Row */}
             <View className="py-4 last:border-0">
               <Text className="text-slate-400 text-[10px] uppercase font-bold mb-1">Team Join Code</Text>
               <View className="flex-row justify-between items-center h-8">
                 <Text className="text-lg text-indigo-600 font-bold tracking-widest">
                   {team.join_code || '---'}
                 </Text>
                 <TouchableOpacity onPress={() => copyToClipboard(team.join_code)}>
                   <SymbolView name="doc.on.doc.fill" size={18} tintColor="#4f46e5" />
                 </TouchableOpacity>
               </View>
             </View>
          </View>
        </View>
      )}

      <View className="mb-8">
        <Text className="text-slate-400 font-bold mb-4 uppercase text-xs tracking-widest">Personal Profile</Text>
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <SettingRow label="Display Name" value={profile.full_name} fieldName="full_name" />
          <SettingRow label="Email Address" value={profile.email} fieldName="email" />
          {profile.role === 'player' && (
            <SettingRow label="Position" value={profile.position} fieldName="position" />
          )}
        </View>
      </View>

      <View className="mb-8">
        <Text className="text-slate-400 font-bold mb-4 uppercase text-xs tracking-widest">Security</Text>
        <TouchableOpacity 
          onPress={() => Alert.alert("Password Reset", "A reset link has been sent to your email.")}
          className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex-row items-center"
        >
          <View className="bg-indigo-50 p-2 rounded-lg">
            <SymbolView name="lock.fill" size={18} tintColor="#4f46e5" />
          </View>
          <Text className="ml-4 text-slate-700 font-bold text-lg">Change Password</Text>
          <View className="flex-1 items-end">
            <SymbolView name="chevron.right" size={14} tintColor="#cbd5e1" />
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        onPress={confirmDeleteAccount} 
        className="bg-white rounded-3xl border border-slate-100 p-5 mb-20 flex-row justify-center items-center"
      >
        <SymbolView name="trash.fill" size={18} tintColor="#ef4444" />
        <Text className="ml-2 font-bold text-red-500">Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}