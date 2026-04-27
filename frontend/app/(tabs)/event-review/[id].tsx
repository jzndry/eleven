import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { SymbolView } from 'expo-symbols';

export default function EventReviewScreen() {
  const { id } = useLocalSearchParams(); // This is the event_id from the schedule
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avgTiredness: 0, avgPerf: 0, totalResponses: 0 });
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);

  const fetchEventData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('questionnaires')
      .select('tiredness_level, team_performance_rating, suggestions')
      .eq('event_id', id);

    if (data && data.length > 0) {
      const total = data.length;
      const avgTiredness = data.reduce((acc, curr) => acc + curr.tiredness_level, 0) / total;
      const avgPerf = data.reduce((acc, curr) => acc + curr.team_performance_rating, 0) / total;
      
      setStats({ 
        avgTiredness: parseFloat(avgTiredness.toFixed(1)), 
        avgPerf: parseFloat(avgPerf.toFixed(1)), 
        totalResponses: total 
      });
    }
    setLoading(false);
  };

  const generateAIReport = async () => {
    setIsAnalysing(true);

    setTimeout(() => {
      setAiInsight(
        "Based on ... " +
        "Common feedback mentions 'heavy legs' and a 'long warm-up'. " +
        "Fake"
      );
      setIsAnalysing(false);
    }, 2000);
  };

  useEffect(() => { fetchEventData(); }, [id]);

  return (
    <ScrollView className="flex-1 bg-slate-50 p-4">
      <Text className="text-2xl font-bold text-slate-900 mb-6">Post-Event Analysis</Text>

      {/* Quantitative Stats Cards */}
      <View className="flex-row justify-between mb-6">
        <View className="bg-white p-4 rounded-2xl shadow-sm w-[48%] items-center border border-slate-100">
          <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Avg Tiredness</Text>
          <Text className={`text-3xl font-black ${stats.avgTiredness > 7 ? 'text-rose-500' : 'text-indigo-600'}`}>
            {stats.avgTiredness}/10
          </Text>
        </View>
        <View className="bg-white p-4 rounded-2xl shadow-sm w-[48%] items-center border border-slate-100">
          <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Team Rating</Text>
          <Text className="text-3xl font-black text-emerald-600">{stats.avgPerf}/10</Text>
        </View>
      </View>

      {/* AI Insight Section */}
      <View className="bg-indigo-600 p-6 rounded-3xl shadow-lg mb-6">
        <View className="flex-row items-center mb-4">
          <SymbolView name="sparkles" size={20} tintColor="white" />
          <Text className="text-white font-bold ml-2 text-lg">AI Squad Insight</Text>
        </View>
        
        {aiInsight ? (
          <Text className="text-indigo-50 leading-6 text-base">{aiInsight}</Text>
        ) : (
          <TouchableOpacity 
            onPress={generateAIReport} 
            disabled={isAnalysing}
            className="bg-white/20 p-4 rounded-xl items-center"
          >
            {isAnalysing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold">Analyse Player Feedback</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <Text className="text-slate-400 text-center text-xs">
        Analysing {stats.totalResponses} player submissions for this event.
      </Text>
    </ScrollView>
  );
}