import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, Text, FlatList, Pressable, 
  ActivityIndicator, StyleSheet, TouchableOpacity, Alert
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { SymbolView } from 'expo-symbols';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';

export default function ScheduleScreen() {
  const router = useRouter();
  const {refresh} = useLocalSearchParams();  // Listen for refresh param to trigger data reload when coming back from add/edit screens
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [userRole, setUserRole] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      // STRICT CHECK: Only fetch if the 'refresh' param is present
      if (refresh === 'true') {
        fetchEvents();
        // Clear the param so it doesn't refresh again next time you view the screen
        router.setParams({ refresh: undefined }); 
      }
    }, [refresh])
  );

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id, role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setUserRole(profile.role);
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
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleTabChange = useCallback((tab: 'upcoming' | 'past') => {
    setActiveTab(tab);
  }, []);

  const displayedEvents = useMemo(() => {
    const now = new Date();
    if (activeTab === 'upcoming') {
      return events.filter(event => new Date(event.event_date) >= now);
    } else {
      return events.filter(event => new Date(event.event_date) < now)
        .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    }
  }, [events, activeTab]);

  const renderEvent = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/(tabs)/event-review/${item.id}`)}
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.toggleContainer}>
          <Pressable 
            onPress={() => handleTabChange('upcoming')}
            style={[styles.toggleButton, activeTab === 'upcoming' && styles.toggleActive]}
          >
            <Text style={[styles.toggleText, activeTab === 'upcoming' && styles.toggleTextActive]}>Upcoming</Text>
          </Pressable>
          <Pressable 
            onPress={() => handleTabChange('past')}
            style={[styles.toggleButton, activeTab === 'past' && styles.toggleActive]}
          >
            <Text style={[styles.toggleText, activeTab === 'past' && styles.toggleTextActive]}>Past</Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-1 px-5">
        {loading ? (
          <ActivityIndicator color="#4f46e5" size="large" className="mt-10" />
        ) : (
          <FlatList
            data={displayedEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEvent}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 140 }} 
            showsVerticalScrollIndicator={false }
            ListEmptyComponent={
              <View className="items-center mt-20">
                <Text className="text-slate-400 font-medium">No {activeTab} events found.</Text>
              </View>
            }
          />
        )}
      </View>
      
      {userRole === 'coach' && (
        <View className="absolute bottom-10 left-0 right-0 items-center px-10">
          <Pressable 
            onPress={() => router.push('/add-event')}
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
              ...styles.fabShadow
            })}
            className="bg-indigo-600 w-full h-16 rounded-2xl flex-row items-center justify-between px-8"
          >
            <Text className="text-white font-bold text-lg">Add new event</Text>
            <SymbolView name="plus" size={22} tintColor="white" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Darker backdrop to make cards pop
  },
  header: {
    padding: 24,
    paddingTop: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toggleActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#4f46e5',
  },
  eventCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20, // Clear vertical separation
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    // iOS Shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4, 
  },
  fabShadow: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  }
});