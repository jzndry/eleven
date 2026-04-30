import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { supabase } from '../lib/supabase';

interface ReviewFormProps {
  eventId: string;
  onSuccess: () => void;
}

export const ReviewForm = ({ eventId, onSuccess }: ReviewFormProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ team_play: 5, personal_perf: 5, improvements: '', comments: '' });

  const submitReview = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth error");

      const { error } = await supabase.from('reviews').insert({
        event_id: eventId,
        player_id: user.id,
        team_play_rating: form.team_play,
        personal_perf_rating: form.personal_perf,
        improvements: form.improvements,
        comments: form.comments
      });

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-slate-800 font-bold text-lg mb-6">Match Questionnaire</Text>
        <Text className="mb-2">Team Performance: {form.team_play}/10</Text>
        <Slider 
          style={{ width: '100%', height: 40 }} minimumValue={1} maximumValue={10} step={1}
          value={form.team_play} onValueChange={(v) => setForm({...form, team_play: v})}
        />
        <Text className="mt-4 mb-2">Personal Performance: {form.personal_perf}/10</Text>
        <Slider 
          style={{ width: '100%', height: 40 }} minimumValue={1} maximumValue={10} step={1}
          value={form.personal_perf} onValueChange={(v) => setForm({...form, personal_perf: v})}
        />
        <TextInput 
          className="bg-white p-4 rounded-2xl border border-slate-200 mt-6 min-h-[100px]"
          placeholder="Improvements?" multiline onChangeText={(t) => setForm({...form, improvements: t})}
        />
        <TouchableOpacity onPress={submitReview} className="bg-blue-600 p-5 rounded-2xl mt-8 mb-10">
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-bold">Submit Review</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};