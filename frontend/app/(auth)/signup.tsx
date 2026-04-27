import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SignUpScreen() {
  const [role, setRole] = useState<'coach' | 'player'>('coach');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [teamInput, setTeamInput] = useState(''); // team name for coach, team ID for player
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    setLoading(true);
    
    // pass the metadata to the auth object
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          // If coach, this is a name to be created; if player, its an ID to join
          [role === 'coach' ? 'temp_team_name' : 'team_id']: teamInput,
        },
      },
    });

    if (error) {
      Alert.alert("Sign Up Error", error.message);
    } else {
      Alert.alert("Success", "Account created successfully!");
    }
    setLoading(false);
  }

  return (
    <ScrollView className="flex-1 bg-white p-6 pt-20">
      <Text className="text-4xl font-bold text-slate-900 mb-2">Create Account</Text>
      
      {/* Role Toggle */}
      <View className="flex-row bg-slate-100 p-1 rounded-2xl mb-8">
        <TouchableOpacity 
          onPress={() => setRole('coach')}
          className={`flex-1 p-3 rounded-xl ${role === 'coach' ? 'bg-white shadow-sm' : ''}`}
        >
          <Text className={`text-center font-bold ${role === 'coach' ? 'text-indigo-600' : 'text-slate-500'}`}>Coach</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setRole('player')}
          className={`flex-1 p-3 rounded-xl ${role === 'player' ? 'bg-white shadow-sm' : ''}`}
        >
          <Text className={`text-center font-bold ${role === 'player' ? 'text-indigo-600' : 'text-slate-500'}`}>Player</Text>
        </TouchableOpacity>
      </View>

      <View className="space-y-4">
        <TextInput className="bg-slate-50 p-4 rounded-2xl border border-slate-200" placeholder="Full Name" value={fullName} onChangeText={setFullName} />
        <TextInput className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4" placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4" placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        
        {/* Dynamic Input Based on Role */}
        <TextInput 
          className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4" 
          placeholder={role === 'coach' ? "Team Name (e.g. Manchester United)" : "Enter Team ID provided by Coach"} 
          value={teamInput} 
          onChangeText={setTeamInput} 
        />

        <TouchableOpacity onPress={signUpWithEmail} disabled={loading} className="bg-indigo-600 p-5 rounded-2xl mt-8 shadow-md">
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-bold text-lg">Create {role === 'coach' ? 'Club' : 'Profile'}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}