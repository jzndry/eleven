import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';

interface CoachSummaryProps {
  summary: string | null;
  responseCount: number;
  attendingCount: number;
  isLoading: boolean;
}

export const CoachSummary = ({ summary, responseCount, attendingCount, isLoading }: CoachSummaryProps) => {
  // We want at least 4 responses, or all attending players if the squad is small
  const threshold = Math.min(4, attendingCount || 0);
  const isReady = responseCount >= threshold;
  const progress = Math.min((responseCount / threshold) * 100, 100);

  if (isLoading) {
    return (
      <View className="p-10 items-center">
        <ActivityIndicator color="#4f46e5" />
      </View>
    );
  }

  if (summary) {
    return (
      <ScrollView className="flex-1">
        <View className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm">
          <Text className="text-indigo-900 font-extrabold text-lg mb-3 uppercase tracking-tighter">
            Gemini AI Insight
          </Text>
          <Text className="text-slate-700 leading-6 text-base font-medium">
            {summary}
          </Text>
          <View className="mt-4 pt-4 border-t border-indigo-100">
            <Text className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
              Analysis based on {responseCount} player responses
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 items-center">
      <Text className="text-slate-800 font-bold text-lg mb-2">Gathering Feedback</Text>
      <Text className="text-slate-500 text-center mb-6">
        {isReady 
          ? "Enough feedback collected! Run the analysis script to generate insights."
          : `Waiting for more players. We need at least ${threshold} responses to start the AI analysis.`}
      </Text>

      {/* Simple Progress Bar */}
      <View className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <View 
          style={{ width: `${progress}%` }} 
          className="h-full bg-indigo-500" 
        />
      </View>
      
      <Text className="text-slate-400 text-xs font-bold mt-3 uppercase">
        {responseCount} / {threshold} Responses Received
      </Text>
    </View>
  );
};