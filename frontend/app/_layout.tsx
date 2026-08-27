import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useProtectedRoute } from '@/navigation/useProtectedRoute';
import "../global.css";

function InitialLayout() {
  const { initialized } = useProtectedRoute();

  // Initialised guard to prevent screen flicker
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* The Add Event Drawer Configuration */}
      <Stack.Screen
        name="add-event"
        options={{
          presentation: 'transparentModal', // Allows the backdrop dimming effect
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          headerShown: false
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return <InitialLayout />;
}
