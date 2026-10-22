import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/src/ui';

export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.teal, tabBarInactiveTintColor: '#87949A', tabBarStyle: { height: 66, paddingTop: 7, paddingBottom: 8, backgroundColor: '#FFFDF9', borderTopColor: '#E5E9E5' }, tabBarLabelStyle: { fontSize: 11, fontWeight: '700' } }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Text style={{ fontSize: 23, color }}>⌂</Text> }} />
    <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIcon: ({ color }) => <Text style={{ fontSize: 21, color }}>▤</Text> }} />
    <Tabs.Screen name="plan" options={{ title: 'Plan', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>◴</Text> }} />
  </Tabs>;
}
