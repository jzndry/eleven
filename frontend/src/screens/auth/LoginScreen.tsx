import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '@/services/supabase';
import { useRouter, Link } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();


  // update this after testing to remove dev quick access and add forgot password link
  async function signInWithEmail(devEmail?: string, devPassword?: string) {
    setLoading(true);
    
    // Use dev credentials if provided, otherwise use state
    const targetEmail = devEmail || email;
    const targetPassword = devPassword || password;

    const { error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword,
    });

    if (error) {
      Alert.alert("Login Failed", error.message);
    } else {
      // Success navigation is usually handled by an Auth Provider listener, 
      // but you can force it here if needed:
      router.replace('/(tabs)/schedule');
      console.log("Login successful for:", targetEmail);
    }
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white">
      <View className="flex-1 justify-center p-6">
        <View className="mb-10 mt-10">
          <Text className="text-4xl font-bold text-slate-900">Coach AI</Text>
          <Text className="text-slate-500 mt-2">Welcome back!</Text>
        </View>

        <View className="space-y-4">
          <TextInput
            className="bg-slate-50 p-4 rounded-2xl border border-slate-200"
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <TouchableOpacity 
            onPress={() => signInWithEmail()}
            disabled={loading}
            className="bg-indigo-600 p-5 rounded-2xl mt-6 shadow-md"
          >
            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-bold text-lg">Sign In</Text>}
          </TouchableOpacity>
        </View>

        {/* --- QUICK LOGIN BUTTONS; DELETE AFTER TESTING --- */} 
        <View className="mt-10 pt-6 border-t border-slate-100">
          <Text className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Dev Quick Access ;)</Text>
          
          <View className="flex-row space-x-3">
            <TouchableOpacity 
              onPress={() => signInWithEmail('test@coach.com', 'password123')}
              className="flex-1 bg-slate-100 p-4 rounded-xl border border-slate-200"
            >
              <Text className="text-center font-bold">Log in Coach</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => signInWithEmail('player@coach.com', 'password123')}
              className="flex-1 bg-slate-100 p-4 rounded-xl border border-slate-200"
            >
              <Text className="text-center font-bold">Log in Player</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Link href="/signup" asChild>
          <TouchableOpacity className="mt-8 mb-10">
            <Text className="text-center text-slate-500">Don't have an account? <Text className="text-indigo-600 font-bold">Sign Up</Text></Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}