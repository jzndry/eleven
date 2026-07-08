import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Pressable, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function SignUpScreen() {
  const router = useRouter();
  const [role, setRole] = useState<'coach' | 'player'>('coach');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [joinCode, setJoinCode] = useState(''); 
  const [loading, setLoading] = useState(false);

  // Memoised toggle to shield the re-render from the navigation context
  const toggleRole = useCallback((newRole: 'coach' | 'player') => {
    setRole(newRole);
  }, []);

  async function signUpWithEmail() {
    // Basic Validation
    if (!email.trim() || !password || !confirmPassword) {
      return Alert.alert("Required Fields", "Please enter your email and a valid password.");
    }

    // Player-specific Validation
    if (role === 'player' && !joinCode.trim()) {
      return Alert.alert("Join Code Required", "Please enter the code provided by your coach to join a team.");
    }

    // Password match check
    if (password !== confirmPassword) {
      return Alert.alert("Password Mismatch", "The passwords entered do not match.");
    }

    setLoading(true);
    
    try {
      let assignedTeamId = null;

      // Verify the join code and get the team ID before signing up
      if (role === 'player') {
        const cleanCode = joinCode.trim().toUpperCase();
        const { data: teamData, error: teamQueryError } = await supabase
          .from('teams')
          .select('id')
          .eq('join_code', cleanCode)
          .maybeSingle();

        if (teamQueryError) throw teamQueryError;
        
        if (!teamData) {
          setLoading(false);
          return Alert.alert("Invalid Code", "We could not find a squad with that join code. Please verify it with your coach.");
        }
        
        assignedTeamId = teamData.id;
      }

      // Proceed with signup, passing the resolved UUID directly to metadata
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            role: role,
            // We save the actual team_id so the database trigger can process it seamlessly
            ...(assignedTeamId ? { team_id: assignedTeamId } : {}),
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          Alert.alert("Email in Use", "An account with this email already exists.");
        } else {
          throw error;
        }
      } else {
        // Successful signup
        router.replace('/(auth)/login');
        Alert.alert(
          "Welcome to Coach AI!", 
          "Your account has been created!"
        );
      }
    } catch (error: any) {
      Alert.alert("Sign Up Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <ScrollView className="flex-1 bg-white p-6 pt-20">
        <Text className="text-4xl font-bold text-slate-900 mb-2">Create Account</Text>
        <Text className="text-slate-500 mb-8">Choose your role to get started.</Text>
        
        {/* Role Toggle Selector */}
        <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 16, marginBottom: 32 }}>
          <Pressable 
            onPress={() => toggleRole('coach')}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: role === 'coach' ? 'white' : 'transparent',
              ...(role === 'coach' ? { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 } : {})
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
              ...(role === 'player' ? { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 } : {})
            }}
          >
            <Text style={{ fontWeight: 'bold', color: role === 'player' ? '#4f46e5' : '#64748b' }}>Player</Text>
          </Pressable>
        </View>

        <View className="space-y-4">
          <TextInput 
            className="bg-slate-50 p-4 rounded-2xl border border-slate-200" 
            placeholder="Email Address" 
            value={email} 
            onChangeText={setEmail} 
            autoCapitalize="none" 
            keyboardType="email-address"
          />
          <TextInput 
            className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4" 
            placeholder="Password" 
            secureTextEntry 
            value={password} 
            onChangeText={setPassword} 
          />
          <TextInput 
            className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4" 
            placeholder="Repeat Password" 
            secureTextEntry 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
          />
          
          {role === 'player' && (
            <TextInput 
              className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4 uppercase" 
              placeholder="Squad Join Code" 
              value={joinCode} 
              onChangeText={setJoinCode} 
              autoCapitalize="characters"
            />
          )}

          {/* Action button */}
          <TouchableOpacity 
            onPress={signUpWithEmail} 
            disabled={loading} 
            activeOpacity={0.8}
            className={`p-5 rounded-2xl mt-8 flex-row justify-center items-center ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold text-lg">Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/(auth)/login')}
            className="mt-6 mb-12"
          >
            <Text className="text-center text-slate-500 font-medium">
              Already have an account? <Text className="text-indigo-600 font-bold">Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}