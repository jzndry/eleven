import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  Alert, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native'; 
import { supabase } from '../lib/supabase';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

export default function AddEventScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    event_type: 'Training',
    location: '',
    opponent: '',
    event_date: new Date(),
  });

  // Memoised toggle to prevent function recreation
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
      router.back(); 
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-8 pt-12">
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-3xl font-extrabold text-slate-900">New Event</Text>
            <Text className="text-slate-500">Schedule a session for your squad</Text>
          </View>
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <SymbolView name="xmark.circle.fill" size={32} tintColor="#cbd5e1" />
          </Pressable>
        </View>

        {/* 
            STABILITY FIX: Removed dynamic classNames.
            Using standard inline styles to prevent styling-engine layout panics.[cite: 1, 6]
        */}
        <Text className="text-slate-500 font-bold mb-3 ml-1 text-xs uppercase tracking-widest">Event Type</Text>
        <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 6, borderRadius: 16, marginBottom: 32 }}>
          {['Training', 'Match'].map((type) => (
            <Pressable 
              key={type}
              onPress={() => toggleType(type)}
              style={{
                flex: 1,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: form.event_type === type ? 'white' : 'transparent',
                // Manual shadow instead of NativeWind classes
                ...(form.event_type === type ? { 
                  shadowColor: '#000', 
                  shadowOffset: { width: 0, height: 1 }, 
                  shadowOpacity: 0.1, 
                  shadowRadius: 2, 
                  elevation: 2 
                } : {})
              }}
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

        <Text className="text-slate-500 font-bold mb-3 ml-1 text-xs uppercase tracking-widest">Location</Text>
        <TextInput 
          placeholder="e.g. West Fields Pitch 4" 
          placeholderTextColor="#94a3b8"
          className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100 text-slate-900"
          value={form.location}
          onChangeText={(t) => setForm(prev => ({ ...prev, location: t }))}
        />

        {form.event_type === 'Match' && (
          <>
            <Text className="text-slate-500 font-bold mb-3 ml-1 text-xs uppercase tracking-widest">Opponent</Text>
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
            {
              backgroundColor: loading ? '#818cf8' : '#4f46e5',
              padding: 20,
              borderRadius: 20,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 20,
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
      </View>
    </ScrollView>
  );
}