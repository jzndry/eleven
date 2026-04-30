// components/AddEventModal.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Pressable 
} from 'react-native'; // Strictly from react-native
import { SymbolView } from 'expo-symbols';
import { supabase } from '../lib/supabase';

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

export const AddEventModal = ({ visible, onClose, onEventCreated }: AddEventModalProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    event_type: 'Training',
    location: '',
    opponent: '',
    event_date: new Date(),
  });

  const handleSave = async () => {
    if (!form.location) return Alert.alert("Error", "A location is required!");
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user?.id)
        .single();

      const { error } = await supabase.from('events').insert([
        { 
          team_id: profile?.team_id,
          event_type: form.event_type.toLowerCase(),
          location: form.location,
          opponent: form.opponent,
          event_date: form.event_date.toISOString()
        }
      ]);

      if (error) throw error;

      onEventCreated(); 
      onClose();
      setForm({ event_type: 'Training', location: '', opponent: '', event_date: new Date() });
      
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={true}
      onRequestClose={onClose}
    >
      {/* 
          CONTEXT INJECTION FIX: 
          Wrap the internal content in a container that doesn't 
          require the global NavigationContainer to be active.
      */}
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        
        <View className="bg-white rounded-t-[40px] p-8 h-[80%]">
          <View className="flex-row justify-between mb-6">
            <Text className="text-2xl font-bold text-slate-900">New Event</Text>
            <TouchableOpacity onPress={onClose}>
              <SymbolView name="xmark.circle.fill" size={28} tintColor="#cbd5e1" />
            </TouchableOpacity>
          </View>

          {/* Event Type Toggle */}
          <View className="flex-row bg-slate-100 p-1.5 rounded-2xl mb-6">
            {['Training', 'Match'].map((type) => (
              <TouchableOpacity 
                key={type}
                onPress={() => setForm({...form, event_type: type})}
                className={`flex-1 py-3 rounded-xl items-center ${form.event_type === type ? 'bg-white shadow-sm' : ''}`}
              >
                <Text className={`font-bold ${form.event_type === type ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-wider">Location</Text>
          <TextInput 
            placeholder="Pitch name or address" 
            className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100"
            value={form.location}
            onChangeText={(t) => setForm({...form, location: t})}
          />

          {form.event_type === 'Match' && (
            <>
              <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-wider">Opponent</Text>
              <TextInput 
                placeholder="Opposition Team Name" 
                className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100"
                value={form.opponent}
                onChangeText={(t) => setForm({...form, opponent: t})}
              />
            </>
          )}

          <TouchableOpacity 
            className={`p-5 rounded-2xl mt-auto flex-row justify-center items-center ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold text-lg">Schedule Event</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};