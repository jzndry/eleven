import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SignUpScreen() {
  const [role, setRole] = useState<'coach' | 'player'>('coach');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [teamInput, setTeamInput] = useState(''); 
  const [loading, setLoading] = useState(false);

  // Memoised toggle to prevent navigation context crashes during re-render[cite: 6]
  const toggleRole = useCallback((newRole: 'coach' | 'player') => {
    setRole(newRole);
  }, []);

  async function signUpWithEmail() {
    if (!email || !password || !fullName || !teamInput) {
      return Alert.alert("Missing Info", "Please fill in all fields to create your profile.");
    }

    setLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
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
      <Text className="text-slate-500 mb-8">Join your club as a coach or player.</Text>
      
      {/* 
          STABILITY FIX: Role Toggle using Pressable and Inline Styles 
          to avoid 'Missing Navigation Context' crashes
      */}
      <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 16, marginBottom: 32 }}>
        <Pressable 
          onPress={() => toggleRole('coach')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: role === 'coach' ? 'white' : 'transparent',
            ...(role === 'coach' ? { elevation: 2, shadowOpacity: 0.1 } : {})
          }}
        >
          <Text style={{ fontWeight: 'bold', color: role === 'coach' ? '#4f46e5' : '#64748b' }}>Coach</Text>
        </Pressable>
        <Pressable 
          onPress={() => toggleRole('player')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: role === 'player' ? 'white' : 'transparent',
            ...(role === 'player' ? { elevation: 2, shadowOpacity: 0.1 } : {})
          }}
        >
          <Text style={{ fontWeight: 'bold', color: role === 'player' ? '#4f46e5' : '#64748b' }}>Player</Text>
        </Pressable>
      </View>

      <View>
        <TextInput 
          className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4" 
          placeholder="Full Name" 
          value={fullName} 
          onChangeText={setFullName} 
        />
        <TextInput 
          className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4" 
          placeholder="Email" 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
        />
        <TextInput 
          className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4" 
          placeholder="Password" 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />
        
        <TextInput 
          className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-8" 
          placeholder={role === 'coach' ? "Team Name (e.g. Manchester United)" : "Enter Team ID from Coach"} 
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