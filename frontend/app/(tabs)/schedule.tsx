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
  Platform,
  Alert
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ScheduleScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null); // Track the role
  const router = useRouter();

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
        .select('team_id, role') // Retrieve role
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserRole(profile.role); // Store the role
        
        if (profile.team_id) {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('team_id', profile.team_id)
            .order('event_date', { ascending: true });
          
          if (!error) setEvents(data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSaveEvent = async () => {
    try {
      if (!form.location) {
        Alert.alert("Missing Information", "Please enter a location.");
        return;
      }
      if (form.event_type === 'Match' && !form.opponent) {
        Alert.alert("Missing Information", "Please enter the opponent.");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found.");

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) throw new Error("Team not verified.");

      const { error } = await supabase
        .from('events')
        .insert({
          team_id: profile.team_id,
          event_type: form.event_type.toLowerCase(), 
          location: form.location,
          opponent: form.event_type === 'Match' ? form.opponent : null,
          event_date: form.event_date.toISOString(), 
        });

      if (error) throw error;

      setModalVisible(false);
      setForm({ event_type: 'Training', location: '', opponent: '', event_date: new Date() });
      fetchEvents();

    } catch (error: any) {
      Alert.alert("Error Saving Event", error.message);
    }
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
          // Reduce padding for players since they don't have the floating buttons
          contentContainerStyle={{ paddingBottom: userRole === 'coach' ? 140 : 20 }} 
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-slate-400">No upcoming events found.</Text>
            </View>
          }
        />
      )}
      
      {/* 3. RULE: Only Coaches see the creation buttons */}
      {userRole === 'coach' && (
        <View className="absolute bottom-8 left-4 right-4 flex-row space-x-3">
          <TouchableOpacity 
            onPress={() => {
              setForm({ ...form, event_type: 'Training', opponent: '' });
              setModalVisible(true);
            }}
            className="flex-1 bg-white h-16 rounded-2xl flex-row items-center justify-center border border-slate-200 shadow-sm"
          >
            <Text className="text-indigo-600 font-bold ml-2">Training</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              setForm({ ...form, event_type: 'Match' });
              setModalVisible(true);
            }}
            className="flex-1 bg-indigo-600 h-16 rounded-2xl flex-row items-center justify-center shadow-lg"
          >
            <Text className="text-white font-bold ml-2">Match</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal - Remains the same, but only reachable by Coaches */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-[40px] p-8 h-[85%] shadow-lg">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-2xl font-bold text-slate-900">New {form.event_type}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <SymbolView name="xmark.circle.fill" size={28} tintColor="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-500 font-bold mb-3 uppercase text-[10px] tracking-widest">Location</Text>
            <TextInput 
              className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 text-slate-900"
              placeholder="e.g. Training Ground"
              placeholderTextColor="#94a3b8"
              value={form.location}
              onChangeText={(text) => setForm({...form, location: text})}
            />

            <Text className="text-slate-500 font-bold mb-3 uppercase text-[10px] tracking-widest">Meet Time</Text>
            <View className="flex-row items-center justify-between mb-6 bg-slate-50 p-2 rounded-2xl border border-slate-200">
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

            {form.event_type === 'Match' && (
              <View>
                <Text className="text-slate-500 font-bold mb-3 uppercase text-[10px] tracking-widest">Opponent</Text>
                <TextInput 
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 text-slate-900"
                  placeholder="e.g KCL"
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