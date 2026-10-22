import { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { useDin } from '@/src/store';
import { colors, PrimaryButton, Section, styles } from '@/src/ui';

function nonnegativePaise(text: string): number {
  const value = Number(text.replace(/[₹,\s]/g, ''));
  if (!Number.isFinite(value) || value < 0 || value > 100_000_000) throw new Error('Enter a valid amount.');
  return Math.round(value * 100);
}

export default function PlanScreen() {
  const { data, saveProfile, setReminders } = useDin();
  const [name, setName] = useState('');
  const [income, setIncome] = useState('');
  const [setAside, setSetAside] = useState('');
  const [morning, setMorning] = useState('08:00');
  const [evening, setEvening] = useState('21:00');
  useEffect(() => {
    setName(data.profile.name); setIncome(data.profile.incomePaise ? String(data.profile.incomePaise / 100) : '');
    setSetAside(data.profile.setAsidePaise ? String(data.profile.setAsidePaise / 100) : '');
    setMorning(data.profile.morningTime); setEvening(data.profile.eveningTime);
  }, [data.profile]);
  function save() {
    try {
      const incomePaise = nonnegativePaise(income);
      const setAsidePaise = nonnegativePaise(setAside || '0');
      if (!name.trim() || !incomePaise) throw new Error('Enter your name and monthly income.');
      if (setAsidePaise > incomePaise) throw new Error('Bills and savings cannot exceed income.');
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(morning) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(evening)) throw new Error('Use 24-hour times such as 08:00 and 21:00.');
      saveProfile({ name: name.trim().slice(0, 30), incomePaise, setAsidePaise, morningTime: morning, eveningTime: evening });
      Alert.alert('Plan saved', 'Your daily numbers and pending reminders have been updated.');
    } catch (error) { Alert.alert('Check your plan', error instanceof Error ? error.message : 'Please check your entries.'); }
  }
  async function toggleReminders() {
    try {
      const enabled = !data.remindersEnabled;
      if (enabled && !data.profile.incomePaise) { Alert.alert('Save your plan first', 'Enter your income and tap Save plan before enabling reminders.'); return; }
      const success = await setReminders(enabled);
      if (!success) Alert.alert('Notifications not allowed', 'Enable notifications for Din in your phone settings.');
      else Alert.alert(enabled ? 'Reminders enabled' : 'Reminders disabled', enabled ? 'The phone will send scheduled morning and evening notifications, even after you close Din. The evening total uses spending recorded so far.' : 'Scheduled Din notifications have been removed.');
    } catch { Alert.alert('Could not update reminders', 'Please check notification permission and try again.'); }
  }
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>MAKE IT YOURS</Text><Text style={styles.title}>Plan</Text><Text style={[styles.subtitle, { marginBottom: 28 }]}>Tell Din what comes in and what must stay aside.</Text>
    <Section title="Your money" />
    <View style={[styles.card, { marginBottom: 25 }]}>
      <Text style={styles.label}>Your name</Text><TextInput accessibilityLabel="Your name" value={name} onChangeText={setName} placeholder="Your name" maxLength={30} style={[styles.input, { marginBottom: 18 }]} />
      <Text style={styles.label}>Monthly take-home income (₹)</Text><TextInput accessibilityLabel="Monthly take-home income" value={income} onChangeText={setIncome} keyboardType="decimal-pad" placeholder="100000" style={[styles.input, { marginBottom: 18 }]} />
      <Text style={styles.label}>Bills + savings to set aside (₹)</Text><TextInput accessibilityLabel="Bills and savings" value={setAside} onChangeText={setSetAside} keyboardType="decimal-pad" placeholder="50500" style={styles.input} />
      <Text style={[styles.subtitle, { fontSize: 12, marginTop: 13 }]}>Din shows income ÷ 30 and a safer daily allowance after bills and savings.</Text>
    </View>
    <Section title="Daily reminders" />
    <View style={[styles.card, { marginBottom: 16 }]}><View style={{ flexDirection: 'row', gap: 12 }}><View style={{ flex: 1 }}><Text style={styles.label}>Morning</Text><TextInput accessibilityLabel="Morning reminder time" value={morning} onChangeText={setMorning} placeholder="08:00" keyboardType="numbers-and-punctuation" style={styles.input} /></View><View style={{ flex: 1 }}><Text style={styles.label}>Evening</Text><TextInput accessibilityLabel="Evening recap time" value={evening} onChangeText={setEvening} placeholder="21:00" keyboardType="numbers-and-punctuation" style={styles.input} /></View></View><Text style={[styles.subtitle, { fontSize: 12, marginTop: 13 }]}>Local notifications remain scheduled after Din closes. Amounts reflect transactions recorded before the app last updated them.</Text></View>
    <PrimaryButton label="Save plan" onPress={save} />
    <Pressable accessibilityRole="button" onPress={toggleReminders} style={[styles.outlineButton, { marginTop: 11 }]}><Text style={styles.outlineText}>{data.remindersEnabled ? 'Turn reminders off' : 'Enable phone reminders'}</Text></Pressable>
    <View style={{ height: 30 }} /><Section eyebrow="DATA SOURCES" title="Bank connection" />
    <View style={styles.card}><Text style={{ color: colors.ink, fontWeight: '800', marginBottom: 8 }}>Not connected</Text><Text style={styles.subtitle}>Automatic bank and UPI tracking requires an eligible Account Aggregator data recipient and provider integration. You can import real transactions from a bank CSV in Activity now.</Text></View>
    <Text style={{ textAlign: 'center', color: '#9AA6AA', fontSize: 11, marginTop: 25 }}>Stored on this device · No bank credentials requested</Text>
  </ScrollView></SafeAreaView>;
}
