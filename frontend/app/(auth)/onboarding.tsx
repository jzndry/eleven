import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';


// This onboarding screen is shown immediately after sign-up for new users to complete their profile setup.
export default function OnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [teamName, setTeamName] = useState(''); // For Coach
  const [position, setPosition] = useState(''); // For Player
  const [role, setRole] = useState<'coach' | 'player' | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      const { data: { user } } = await supabase.auth.getUser();
      // Role was set in user_metadata during the sign-up process
      setRole(user?.user_metadata?.role || 'player');
    }
    fetchUserRole();
  }, []);

  const handleFinishSetup = async () => {
    // Validation based on role
    if (!fullName.trim()) {
      return Alert.alert("Required Field", "Please enter your full name.");
    }

    if (role === 'coach' && !teamName.trim()) {
      return Alert.alert("Required Field", "Please enter your team name.");
    }

    if (role === 'player' && !position.trim()) {
      return Alert.alert("Required Field", "Please enter your playing position.");
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User session not found.");

      // Update Profile table with name, onboarding status
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName.trim(), 
          position: role === 'player' ? position.trim() : null,  // Update position too if player
          onboarding_complete: true 
        })
        .eq('id', user.id);

        // If there's an error updating the profile, should not proceed to create a team or navigate to the app
      if (profileError) throw profileError;

      // If role is coach, create the new team entry
      if (role === 'coach') {
        // Generating a unique join code (e.g., 6 characters)
        const generatedJoinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { error: teamError } = await supabase
          .from('teams')
          .insert([{ 
            team_name: teamName.trim(), 
            coach_id: user.id,
            join_code: generatedJoinCode 
          }]);
        
        if (teamError) throw teamError;
      }

      // Move to the main app
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert("Setup Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <View className="flex-1 bg-white justify-center">
        <ActivityIndicator color="#4f46e5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8">
        <View className="mt-20">
          <Text className="text-4xl font-bold text-slate-900 mb-2">Final Touches</Text>
          <Text className="text-slate-500 mb-10">
            Tell us a bit more about yourself to complete your profile.
          </Text>

          <Text className="text-slate-400 font-bold mb-3 ml-1 text-xs uppercase tracking-widest">
            Full Name
          </Text>
          <TextInput 
            className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6 text-lg" 
            placeholder="e.g. Jandry Rodriguez" 
            value={fullName} 
            onChangeText={setFullName} 
          />

          {role === 'coach' ? (
            <>
              <Text className="text-slate-400 font-bold mb-3 ml-1 text-xs uppercase tracking-widest">
                Team/Club Name
              </Text>
              <TextInput 
                className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6 text-lg" 
                placeholder="e.g. Queen Mary Football Club " 
                value={teamName} 
                onChangeText={setTeamName} 
              />
            </>
          ) : (
            <>
              <Text className="text-slate-400 font-bold mb-3 ml-1 text-xs uppercase tracking-widest">
                Playing Position
              </Text>
              <TextInput 
                className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6 text-lg" 
                placeholder="e.g. Striker, Center Back" 
                value={position} 
                onChangeText={setPosition} 
              />
            </>
          )}

          <TouchableOpacity 
            onPress={handleFinishSetup}
            disabled={loading}
            className={`h-16 rounded-2xl flex-row justify-center items-center mt-6 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Complete Setup</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}