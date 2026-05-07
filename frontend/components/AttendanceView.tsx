import React from 'react';
import { View, Text, TouchableOpacity, DimensionValue } from 'react-native';

interface AttendanceProps {
  role: 'player' | 'coach';
  stats: { attending: number; declined: number; no_response: number; total: number };
  playerStatus: string | null;
  hasEventPassed: boolean;
  onRSVP: (status: 'attending' | 'declined') => void;
}

export const AttendanceView = ({ role, stats, playerStatus, hasEventPassed, onRSVP }: AttendanceProps) => {
  if (role === 'coach') {
    const total = stats.total || 1;
    const attendingWidth = `${(stats.attending / total) * 100}%`;
    const declinedWidth = `${(stats.declined / total) * 100}%`;
    const noResponseWidth = `${(stats.no_response / total) * 100}%`;

    return (
      <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <Text className="font-bold text-lg mb-4 text-slate-800">Squad Availability</Text>
        <View className="h-4 flex-row w-full rounded-full overflow-hidden mb-6 bg-slate-100">
          <View style={{ width: attendingWidth as DimensionValue }} className="bg-green-500" />
          <View style={{ width: declinedWidth as DimensionValue }} className="bg-red-500" />
          <View style={{ width: noResponseWidth as DimensionValue }} className="bg-slate-300" />
        </View>
        <View className="flex-row justify-between px-2">
          <View className="items-center">
            <Text className="text-green-600 font-bold text-xl">{stats.attending}</Text>
            <Text className="text-slate-500 text-[10px] uppercase font-bold">Attending</Text>
          </View>
          <View className="items-center">
            <Text className="text-red-600 font-bold text-xl">{stats.declined}</Text>
            <Text className="text-slate-500 text-[10px] uppercase font-bold">Declined</Text>
          </View>
          <View className="items-center">
            <Text className="text-slate-600 font-bold text-xl">{stats.no_response}</Text>
            <Text className="text-slate-500 text-[10px] uppercase font-bold">No Reply</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-2">
      {/* Increased spacing between buttons */}
      <View className="space-y-6">
        <TouchableOpacity 
          disabled={hasEventPassed}
          onPress={() => onRSVP('attending')}
          className={`py-5 rounded-2xl items-center ${playerStatus === 'attending' ? 'bg-green-600' : 'bg-green-500'}`}
        >
          <Text className="font-bold text-lg text-white">Attending</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          disabled={hasEventPassed}
          onPress={() => onRSVP('declined')}
          className={`py-5 rounded-2xl items-center ${playerStatus === 'declined' ? 'bg-red-600' : 'bg-red-500'}`}
        >
          <Text className="font-bold text-lg text-white">Declined</Text>
        </TouchableOpacity>
      </View>

      {/* Conditionally rendered message when the event has passed */}
      {hasEventPassed && (
        <Text className="text-center text-slate-500 mt-6 font-medium">
          Event has passed. Attendance cannot be changed.
        </Text>
      )}
    </View>
  );
};