import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  TextInput, 
  Pressable,
  Platform
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ScheduleScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  // Form State for New Event
  const [form, setForm] = useState({
    event_type: 'Training',
    location: '',
    opponent: '',
    event_date: new Date(),
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (profile?.team_id) {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('team_id', profile.team_id)
          .order('event_date', { ascending: true });
        
        if (!error) setEvents(data || []);
      }
    } catch (err) {
      console.error("Error fetching schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchEvents(); 
  }, []);

  const handleSaveEvent = async () => {
    // Logic for Supabase insert will go here
    // For now, we just close and reset
    setModalVisible(false);
    fetchEvents();
  };

  const renderEvent = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/event-review/${item.id}`)}
      activeOpacity={0.8}
      className="bg-white p-5 mb-4 rounded-3xl shadow-sm border border-slate-100"
    >
      <View className="flex-row justify-between items-center mb-2">
        <View className={`px-3 py-1 rounded-full ${item.event_type === 'match' ? 'bg-amber-100' : 'bg-indigo-100'}`}>
          <Text className={`text-[10px] font-bold uppercase ${item.event_type === 'match' ? 'text-amber-700' : 'text-indigo-700'}`}>
            {item.event_type}
          </Text>
        </View>
        <SymbolView name="chevron.right" size={14} tintColor="#cbd5e1" />
      </View>
      
      <Text className="text-xl font-bold text-slate-900 mb-1">
        {item.event_type === 'match' ? `Match vs ${item.opponent || 'TBC'}` : 'Training Session'}
      </Text>
      
      <View className="flex-row items-center mt-3">
        <SymbolView name="calendar" size={14} tintColor="#64748b" />
        <Text className="text-slate-500 text-sm ml-1 mr-4">
          {new Date(item.event_date).toLocaleDateString('en-GB')}
        </Text>
        <SymbolView name="mappin.and.ellipse" size={14} tintColor="#64748b" />
        <Text className="text-slate-500 text-sm ml-1">{item.location || 'TBC'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-50 p-4">
      {loading ? (
        <ActivityIndicator color="#4f46e5" size="large" className="mt-10" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={{ paddingBottom: 120 }} 
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-slate-400">No upcoming events found.</Text>
            </View>
          }
        />
      )}
      
      {/* Main Create Event Button */}
      <View className="absolute bottom-8 left-4 right-4 items-center">
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => setModalVisible(true)}
          className="bg-indigo-600 h-16 w-full rounded-2xl flex-row items-center justify-center shadow-2xl"
        >
          <SymbolView name="plus.circle.fill" size={20} tintColor="white" />
          <Text className="text-white font-bold text-lg ml-2">Create New Event</Text>
        </TouchableOpacity>
      </View>

      {/* Modal - Event Creator */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-[40px] p-8 h-[85%] shadow-lg">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-2xl font-bold text-slate-900">New Event</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <SymbolView name="xmark.circle.fill" size={28} tintColor="#cbd5e1" />
              </TouchableOpacity>
            </View>
            
            {/* 1. Event Type Selector */}
            <Text className="text-slate-500 font-bold mb-3 uppercase text-[10px] tracking-widest">Event Type</Text>
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

            {/* 2. Location */}
            <Text className="text-slate-500 font-bold mb-3 uppercase text-[10px] tracking-widest">Location</Text>
            <TextInput 
              className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 text-slate-900"
              placeholder="e.g. Training Ground"
              placeholderTextColor="#94a3b8"
              value={form.location}
              onChangeText={(text) => setForm({...form, location: text})}
            />

            {/* 3. Date and Time (Meet Time) */}
            <Text className="text-slate-500 font-bold mb-3 uppercase text-[10px] tracking-widest">Meet Time</Text>
            <View className="flex-row items-center justify-between mb-6">
              <DateTimePicker
                value={form.event_date}
                mode="date"
                display="default"
                onChange={(e, date) => date && setForm({...form, event_date: date})}
              />
              <DateTimePicker
                value={form.event_date}
                mode="time"
                is24Hour={true}
                minuteInterval={15}
                display="default"
                onChange={(e, date) => date && setForm({...form, event_date: date})}
              />
            </View>

            {/* 4. Opponent (Conditional) */}
            {form.event_type === 'Match' && (
              <View>
                <Text className="text-slate-500 font-bold mb-3 uppercase text-[10px] tracking-widest">Opponent</Text>
                <TextInput 
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 text-slate-900"
                  placeholder="e.g. Rival FC"
                  placeholderTextColor="#94a3b8"
                  value={form.opponent}
                  onChangeText={(text) => setForm({...form, opponent: text})}
                />
              </View>
            )}

            <TouchableOpacity 
              className="bg-indigo-600 p-5 rounded-2xl mt-auto shadow-md"
              onPress={handleSaveEvent}
            >
              <Text className="text-white text-center font-bold text-lg">Schedule {form.event_type}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}