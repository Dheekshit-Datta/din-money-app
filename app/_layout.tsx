import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DinProvider } from '@/src/store';
import { colors } from '@/src/ui';

export default function RootLayout() {
  return <DinProvider>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add" options={{ presentation: 'modal', headerShown: true, title: 'Add expense', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.ink }} />
    </Stack>
  </DinProvider>;
}
