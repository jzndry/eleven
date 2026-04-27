import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

export default function AddEventModal({ visible, onClose, onEventCreated }: AddEventModalProps) {
  const [form, setForm] = useState({
    event_type: 'Training',
    location: '',
    opponent: '',
    event_date: new Date(),
  });

  const handleSave = () => {
    // Logic for Supabase insert goes here later
    onEventCreated();
    onClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-[40px] p-8 h-[85%] shadow-lg">
          
          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-2xl font-bold text-slate-900">Create Event</Text>
            <TouchableOpacity onPress={onClose}>
              <SymbolView name="xmark.circle.fill" size={28} tintColor="#cbd5e1" />
            </TouchableOpacity>
          </View>

          {/* 1. Event Type Selector */}
          <Text className="text-slate-500 font-bold mb-3 uppercase text-xs">Event Type</Text>
          <View className="flex-row bg-slate-100 p-1 rounded-2xl mb-6">
            <Pressable 
              onPress={() => setForm({...form, event_type: 'Training'})}
              className={`flex-1 py-3 rounded-xl items-center ${form.event_type === 'Training' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`font-bold ${form.event_type === 'Training' ? 'text-indigo-600' : 'text-slate-500'}`}>Training</Text>
            </Pressable>
            <Pressable 
              onPress={() => setForm({...form, event_type: 'Match'})}
              className={`flex-1 py-3 rounded-xl items-center ${form.event_type === 'Match' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`font-bold ${form.event_type === 'Match' ? 'text-indigo-600' : 'text-slate-500'}`}>Match</Text>
            </Pressable>
            <View className="flex-1 py-3 items-center opacity-30">
              <Text className="font-bold text-slate-400">Other</Text>
            </View>
          </View>

          {/* 2. Location Field */}
          <Text className="text-slate-500 font-bold mb-3 uppercase text-xs">Location</Text>
          <TextInput 
            className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6"
            placeholder="e.g. Training Ground Pitch 1"
            value={form.location}
            onChangeText={(val) => setForm({...form, location: val})}
          />

          {/* 3. Meet Time (Date & Time Row) */}
          <Text className="text-slate-500 font-bold mb-3 uppercase text-xs">Meet Time</Text>
          <View className="flex-row justify-between items-center bg-slate-50 p-2 rounded-2xl border border-slate-200 mb-6">
            <DateTimePicker
              value={form.event_date}
              mode="date"
              display="default"
              onChange={(_, date) => date && setForm({...form, event_date: date})}
            />
            <DateTimePicker
              value={form.event_date}
              mode="time"
              is24Hour={true}
              minuteInterval={15}
              display="default"
              onChange={(_, date) => date && setForm({...form, event_date: date})}
            />
          </View>

          {/* 4. Opponent Field (Conditional) */}
          {form.event_type === 'Match' && (
            <View>
              <Text className="text-slate-500 font-bold mb-3 uppercase text-xs">Opponent</Text>
              <TextInput 
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6"
                placeholder="e.g. Rival FC"
                value={form.opponent}
                onChangeText={(val) => setForm({...form, opponent: val})}
              />
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity 
            className="bg-indigo-600 p-5 rounded-2xl mt-auto"
            onPress={handleSave}
          >
            <Text className="text-white text-center font-bold text-lg">Schedule {form.event_type}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}