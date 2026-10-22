import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { CATEGORIES, Category, categorize, localDate, merchantName, parseRupees } from '@/src/finance';
import { useDin } from '@/src/store';
import { colors, PrimaryButton, styles } from '@/src/ui';

export default function AddExpenseScreen() {
  const { addTransaction, data } = useDin();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(localDate());
  const [category, setCategory] = useState<Category>('Other');
  function save() {
    try {
      const amountPaise = parseRupees(amount);
      const trimmed = description.trim();
      if (!trimmed) throw new Error('Describe the expense.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T12:00:00Z`).valueOf()) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) throw new Error('Use a valid date like 2026-10-22.');
      addTransaction({ date, description: trimmed, amountPaise, category });
      router.back();
    } catch (error) { Alert.alert('Check the expense', error instanceof Error ? error.message : 'Please check the details.'); }
  }
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>NEW TRANSACTION</Text><Text style={[styles.title, { marginBottom: 25 }]}>Add expense</Text>
    <Text style={styles.label}>What was it?</Text><TextInput accessibilityLabel="Expense description" value={description} onChangeText={text => { setDescription(text); setCategory(data.merchantRules.find(rule => rule.merchant === merchantName(text))?.category ?? categorize(text)); }} placeholder="Coffee, groceries, UPI…" maxLength={100} style={[styles.input, { marginBottom: 18 }]} />
    <Text style={styles.label}>Amount (₹)</Text><TextInput accessibilityLabel="Expense amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="250" style={[styles.input, { marginBottom: 18 }]} />
    <Text style={styles.label}>Date (YYYY-MM-DD)</Text><TextInput accessibilityLabel="Expense date" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" style={[styles.input, { marginBottom: 23 }]} />
    <Text style={styles.label}>Category</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 }}>{CATEGORIES.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)} style={{ borderRadius: 20, paddingVertical: 9, paddingHorizontal: 13, backgroundColor: category === item ? colors.teal : colors.white, borderWidth: 1, borderColor: category === item ? colors.teal : colors.line }}><Text style={{ color: category === item ? colors.white : colors.ink, fontSize: 12, fontWeight: '700' }}>{item}</Text></Pressable>)}</View>
    <PrimaryButton label="Save expense" onPress={save} />
    <Text style={[styles.subtitle, { fontSize: 12, marginTop: 16 }]}>Transfers between your own accounts are excluded from spending totals.</Text>
  </ScrollView></SafeAreaView>;
}
