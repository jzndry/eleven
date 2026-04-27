import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter, Link } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert("Login Failed", error.message);
    setLoading(false);
  }

  return (
    <View className="flex-1 bg-white justify-center p-6">
      <View className="mb-10">
        <Text className="text-4xl font-bold text-slate-900">Coach AI</Text>
        <Text className="text-slate-500 mt-2">Welcome back, Gaffer.</Text>
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
          onPress={signInWithEmail}
          disabled={loading}
          className="bg-indigo-600 p-5 rounded-2xl mt-6 shadow-md"
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-bold text-lg">Sign In</Text>}
        </TouchableOpacity>
      </View>

      <Link href="/signup" asChild>
        <TouchableOpacity className="mt-8">
          <Text className="text-center text-slate-500">Don't have an account? <Text className="text-indigo-600 font-bold">Sign Up</Text></Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}