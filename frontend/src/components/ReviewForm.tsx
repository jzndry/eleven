import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { supabase } from '@/services/supabase';

interface ReviewFormProps {
  eventId: string;
  onSuccess: () => void;
}

export const ReviewForm = ({ eventId, onSuccess }: ReviewFormProps) => {
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  
  const [form, setForm] = useState({ 
    team_performance_rating: 5, 
    player_performance_satisfaction: 5, 
    tactics_comment: '', 
    further_comments: '' 
  });

  useEffect(() => {
    checkExistingReview();
  }, []);

  const checkExistingReview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Checking if a questionnaire already exists for this player and event
      const { data, error } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('event_id', eventId)
        .eq('player_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If data is returned, fill in the form and lock it
      if (data) {
        setForm({
          team_performance_rating: data.team_performance_rating || 5,
          player_performance_satisfaction: data.player_performance_satisfaction || 5,
          tactics_comment: data.tactics_comment || '',
          further_comments: data.further_comments || ''
        });
        setIsSubmitted(true);
      }
    } catch (err: any) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (isSubmitted) return; // Extra guardrail to prevent multiple submissions in case of double taps
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth error");

      const { error } = await supabase.from('questionnaires').insert({
        event_id: eventId,
        player_id: user.id,
        team_performance_rating: form.team_performance_rating,
        player_performance_satisfaction: form.player_performance_satisfaction,
        tactics_comment: form.tactics_comment,
        further_comments: form.further_comments
      });

      if (error) throw error;
      
      setIsSubmitted(true);
      onSuccess();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show a spinner while checking the initial status (if the user has already submitted a review or not)
  if (loading && !isSubmitted) {
    return <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-slate-800 font-bold text-lg mb-6">
          {isSubmitted ? "Match Questionnaire (Completed)" : "Match Questionnaire"}
        </Text>
        
        <Text className="mb-2">Team Performance: {form.team_performance_rating}/10</Text>
        <Slider 
          style={{ width: '100%', height: 40, opacity: isSubmitted ? 0.5 : 1 }} 
          minimumValue={1} maximumValue={10} step={1}
          value={form.team_performance_rating} 
          onValueChange={(v) => setForm({...form, team_performance_rating: v})}
          disabled={isSubmitted}
        />
        
        <Text className="mt-4 mb-2">Personal Performance: {form.player_performance_satisfaction}/10</Text>
        <Slider 
          style={{ width: '100%', height: 40, opacity: isSubmitted ? 0.5 : 1 }} 
          minimumValue={1} maximumValue={10} step={1}
          value={form.player_performance_satisfaction} 
          onValueChange={(v) => setForm({...form, player_performance_satisfaction: v})}
          disabled={isSubmitted}
        />
        
        <TextInput 
          className={`p-4 rounded-2xl border mt-6 min-h-[100px] ${isSubmitted ? 'bg-slate-100 border-slate-100 text-slate-500' : 'bg-white border-slate-200'}`}
          placeholder="Tactical Improvements?" 
          multiline 
          value={form.tactics_comment}
          onChangeText={(t) => setForm({...form, tactics_comment: t})}
          editable={!isSubmitted}
        />

        <TextInput 
          className={`p-4 rounded-2xl border mt-4 min-h-[100px] ${isSubmitted ? 'bg-slate-100 border-slate-100 text-slate-500' : 'bg-white border-slate-200'}`}
          placeholder="Further Comments?" 
          multiline 
          value={form.further_comments}
          onChangeText={(t) => setForm({...form, further_comments: t})}
          editable={!isSubmitted}
        />

        <TouchableOpacity 
          onPress={submitReview} 
          disabled={isSubmitted}
          className={`p-5 rounded-2xl mt-8 mb-10 ${isSubmitted ? 'bg-slate-300' : 'bg-blue-600'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" /> 
          ) : (
            <Text className={`text-center font-bold ${isSubmitted ? 'text-slate-500' : 'text-white'}`}>
              {isSubmitted ? 'Review Submitted' : 'Submit Review'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};