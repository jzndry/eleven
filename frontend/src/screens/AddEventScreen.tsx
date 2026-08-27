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
  Dimensions,
  Platform
} from 'react-native'; 
import { getCurrentUser } from '@/services/auth';
import { getRoleAndTeam } from '@/services/profiles';
import { createEvent } from '@/services/events';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { EventType } from '@/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AddEventScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios'); 
  
  const [form, setForm] = useState({
    event_type: 'Training',
    location: '',
    opponent: '',
    event_date: new Date(),
  });

  
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || form.event_date;
    setShowPicker(Platform.OS === 'ios'); 
    setForm(prev => ({ ...prev, event_date: currentDate }));
  };

  const toggleType = useCallback((type: string) => {
    setForm(prev => ({ 
      ...prev, 
      event_type: type,
      opponent: type === 'Training' ? '' : prev.opponent 
    }));
  }, []);

  const handleSave = async () => {
    if (!form.location.trim()) {
      return Alert.alert("Required Field", "Please enter a location for the session.");
    }

    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("No authenticated user found.");
      const profile = await getRoleAndTeam(user.id);

      if (!profile?.team_id) throw new Error("No team found linked to your profile.");

      const { error } = await createEvent({
        team_id: profile.team_id,
        event_type: form.event_type.toLowerCase() as EventType,
        location: form.location.trim(),
        opponent: form.event_type === 'Match' ? form.opponent.trim() : null,
        event_date: form.event_date.toISOString()
      });

      if (error) throw error;
      
      router.replace({
        pathname: '/(tabs)/schedule',
        params: { refresh: 'true' }
      });
    } catch (error: any) {
      Alert.alert("Scheduling Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={{ flex: 1 }} onPress={() => router.back()} />

      <View style={styles.drawer}>
        <View style={styles.handlebar} />

        <View style={{ flex: 1 }}>
          <ScrollView 
            className="px-8 pt-2" 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-8">
              <Text className="text-3xl font-extrabold text-slate-900">New Event</Text>
              <Text className="text-slate-500">Organise your squad's next session</Text>
            </View>

            <Text className="text-slate-400 font-bold mb-3 ml-1 text-[10px] uppercase tracking-widest">Type</Text>
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
                  <Text style={{ fontWeight: 'bold', color: form.event_type === type ? '#4f46e5' : '#64748b' }}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="text-slate-400 font-bold mb-3 ml-1 text-[10px] uppercase tracking-widest">Date & Time</Text>
            <View className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100 flex-row justify-between items-center">
              {Platform.OS === 'android' && (
                <Pressable onPress={() => setShowPicker(true)}>
                  <Text className="text-slate-900 font-semibold text-lg">
                    {form.event_date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </Pressable>
              )}
              
              {showPicker && (
                <DateTimePicker
                  value={form.event_date}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  onChange={onDateChange}
                  accentColor="#4f46e5"
                  minimumDate={new Date()}
                />
              )}
              <SymbolView name="calendar" size={20} tintColor="#64748b" />
            </View>

            <Text className="text-slate-400 font-bold mb-3 ml-1 text-[10px] uppercase tracking-widest">Location</Text>
            <TextInput 
              placeholder="e.g. Academy Pitch 1" 
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100 text-slate-900"
              value={form.location}
              onChangeText={(t) => setForm(prev => ({ ...prev, location: t }))}
            />

            {form.event_type === 'Match' && (
              <>
                <Text className="text-slate-400 font-bold mb-3 ml-1 text-[10px] uppercase tracking-widest">Opposition</Text>
                <TextInput 
                  placeholder="Name of opponent" 
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100 text-slate-900"
                  value={form.opponent}
                  onChangeText={(t) => setForm(prev => ({ ...prev, opponent: t }))}
                />
              </>
            )}
            
            <View style={{ height: 100 }} />
          </ScrollView>
        </View>

       
        <View style={styles.footer}>
          <Pressable 
            disabled={loading}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: loading ? '#818cf8' : '#4f46e5',
                opacity: pressed ? 0.9 : 1,
                zIndex: 100, // Ensure it's on top? had isssues 
              }
            ]}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white font-bold text-lg mr-2">Schedule Event</Text>
                <SymbolView name="calendar.badge.plus" size={22} tintColor="white" />
              </>
            )}
          </Pressable>
        </View>
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
    height: SCREEN_HEIGHT * 0.85, 
    backgroundColor: 'white',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    // Removed overflow: hidden so button can breathe
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
  footer: {
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40, // Extra padding for iOS to account for home indicator
    paddingTop: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  saveBtn: {
    padding: 20,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  }
});