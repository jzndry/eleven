import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  StyleSheet,
  Dimensions
} from 'react-native'; 
import { supabase } from '../lib/supabase';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AddEventScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    event_type: 'Training',
    location: '',
    opponent: '',
    event_date: new Date(),
  });

  const toggleType = useCallback((type: string) => {
    setForm(prev => ({ 
      ...prev, 
      event_type: type,
      opponent: type === 'Training' ? '' : prev.opponent 
    }));
  }, []);

  const handleSave = async () => {
    if (!form.location) {
      return Alert.alert("Error", "A location is required to organise this event.");
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.team_id) throw new Error("No team found for this profile.");

      const { error } = await supabase.from('events').insert([{ 
        team_id: profile.team_id,
        event_type: form.event_type.toLowerCase(),
        location: form.location,
        opponent: form.event_type === 'Match' ? form.opponent : null,
        event_date: form.event_date.toISOString()
      }]);

      if (error) throw error;
      
      router.replace({
        pathname: '/(tabs)/schedule',
        params: { refresh: 'true' }
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={{ flex: 1 }} onPress={() => router.back()} />

      <View style={styles.drawer}>
        <View style={styles.handlebar} />

        <ScrollView 
          className="px-8 pt-2" 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8">
            <Text className="text-3xl font-extrabold text-slate-900">New Event</Text>
            <Text className="text-slate-500">Schedule a session for your squad</Text>
          </View>

          <Text className="text-slate-500 font-bold mb-3 ml-1 text-[10px] uppercase tracking-widest">Event Type</Text>
          <View style={styles.toggleRow}>
            {['Training', 'Match'].map((type) => (
              <Pressable 
                key={type}
                onPress={() => toggleType(type)}
                style={[
                  styles.toggleBtn,
                  form.event_type === type && styles.toggleBtnActive
                ]}
              >
                <Text style={{ 
                  fontWeight: 'bold', 
                  color: form.event_type === type ? '#4f46e5' : '#64748b' 
                }}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-slate-500 font-bold mb-3 ml-1 text-[10px] uppercase tracking-widest">Location</Text>
          <TextInput 
            placeholder="e.g. West Fields Pitch 4" 
            placeholderTextColor="#94a3b8"
            className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100 text-slate-900"
            value={form.location}
            onChangeText={(t) => setForm(prev => ({ ...prev, location: t }))}
          />

          {form.event_type === 'Match' && (
            <>
              <Text className="text-slate-500 font-bold mb-3 ml-1 text-[10px] uppercase tracking-widest">Opponent</Text>
              <TextInput 
                placeholder="Opposition Team Name" 
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100 text-slate-900"
                value={form.opponent}
                onChangeText={(t) => setForm(prev => ({ ...prev, opponent: t }))}
              />
            </>
          )}

          <Pressable 
            disabled={loading}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: loading ? '#818cf8' : '#4f46e5',
                opacity: pressed ? 0.9 : 1,
              }
            ]}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white font-bold text-lg mr-2">Schedule Event</Text>
                <SymbolView name="calendar.badge.plus" size={20} tintColor="white" />
              </>
            )}
          </Pressable>
          
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end',
  },
  drawer: {
    height: SCREEN_HEIGHT * 0.5, 
    backgroundColor: 'white',
    borderTopLeftRadius: 40, // Slightly more rounded for a "softer" feel
    borderTopRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handlebar: {
    width: 36,
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    alignSelf: 'center',
    marginVertical: 14,
  },
  toggleRow: { 
    flexDirection: 'row', 
    backgroundColor: '#f1f5f9', 
    padding: 6, 
    borderRadius: 16, 
    marginBottom: 32 
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center', 
  },
  toggleBtnActive: {
    backgroundColor: 'white',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
    elevation: 2 
  },
  saveBtn: {
    padding: 20,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  }
});