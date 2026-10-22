import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, SafeAreaView, Text, TextInput, View } from 'react-native';
import { CATEGORIES, Category, formatRupees, merchantName, Transaction } from '@/src/finance';
import { useDin } from '@/src/store';
import { colors, OutlineButton, Section, styles } from '@/src/ui';

export default function ActivityScreen() {
  const { data, importCsv, previewCsv, setCategory, setMerchantRule, removeTransaction } = useDin();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [query, setQuery] = useState('');
  const [pendingCsv, setPendingCsv] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReturnType<typeof previewCsv> | null>(null);
  const transactions = [...data.transactions].filter(t => `${t.description} ${t.category} ${t.date} ${formatRupees(t.amountPaise)}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => b.date.localeCompare(a.date));
  async function pickCsv() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'], copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > 5_000_000) throw new Error('Choose a CSV under 5 MB.');
      const csv = await new File(asset.uri).text();
      const importPreview = previewCsv(csv);
      setPendingCsv(csv); setPreview(importPreview);
    } catch (error) { Alert.alert('Could not import', error instanceof Error ? error.message : 'Please choose a valid CSV.'); }
  }
  function confirmImport() {
    if (!pendingCsv) return;
    try { const result = importCsv(pendingCsv); setPendingCsv(null); setPreview(null); Alert.alert('Import complete', `${result.added} added · ${result.duplicates} overlapping records skipped.`); }
    catch (error) { Alert.alert('Could not import', error instanceof Error ? error.message : 'Please try again.'); }
  }
  function chooseCategory(category: Category) {
    if (!selected) return;
    const transaction = selected; setSelected(null);
    Alert.alert('Apply category', `Use ${category} for just this entry or every matching “${merchantName(transaction.description)}” transaction?`, [
      { text: 'Just this', onPress: () => setCategory(transaction.id, category) },
      { text: 'All matching', onPress: () => setMerchantRule(transaction.description, category) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }
  function confirmDelete(transaction: Transaction) {
    Alert.alert('Delete expense?', transaction.description, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => removeTransaction(transaction.id) }]);
  }
  return <SafeAreaView style={styles.screen}>
    <FlatList
      data={transactions}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<>
        <Text style={styles.eyebrow}>EVERY TRANSACTION</Text><Text style={styles.title}>Activity</Text>
        <Text style={[styles.subtitle, { marginBottom: 24 }]}>Real expenses you added or imported. Edit any category.</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
          <View style={{ flex: 1 }}><OutlineButton label="Import bank CSV" onPress={pickCsv} /></View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/add')} style={[styles.button, { flex: 1 }]}><Text style={styles.buttonText}>+ Add expense</Text></Pressable>
        </View>
        <TextInput accessibilityLabel="Search transactions" placeholder="Search merchant, category, date or amount" value={query} onChangeText={setQuery} style={[styles.input, { marginBottom: 24 }]} />
        <Section eyebrow="YOUR RECORDS" title={`${transactions.length} transactions`} />
      </>}
      ListEmptyComponent={<View style={styles.card}><Text style={{ color: colors.ink, fontWeight: '700' }}>{query ? 'No matching transactions' : 'Nothing recorded yet'}</Text><Text style={styles.subtitle}>{query ? 'Try another search.' : 'Add an expense or import a bank CSV. Din starts with no sample spending.'}</Text></View>}
      renderItem={({ item }) => <View style={{ backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ backgroundColor: '#E5F3EB', width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.teal, fontWeight: '800' }}>{item.category === 'Food' ? '♨' : item.category === 'Groceries' ? '▣' : '₹'}</Text></View>
        <View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: colors.ink, fontWeight: '700', fontSize: 14 }}>{item.description}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Change category for ${item.description}`} onPress={() => setSelected(item)}><Text style={{ color: colors.teal, fontSize: 12, marginTop: 4 }}>{item.category} ▾  ·  {item.date}</Text></Pressable></View>
        <View style={{ alignItems: 'flex-end' }}><Text style={{ color: colors.ink, fontWeight: '800' }}>−{formatRupees(item.amountPaise)}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item.description}`} onPress={() => confirmDelete(item)}><Text style={{ color: '#A1AAB0', fontSize: 12, marginTop: 5 }}>Delete</Text></Pressable></View>
      </View>}
    />
    <Modal transparent visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}><Pressable onPress={() => setSelected(null)} style={{ flex: 1, backgroundColor: '#0D173455', justifyContent: 'flex-end' }}><View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 }}><Text style={styles.sectionTitle}>Choose category</Text><Text style={[styles.subtitle, { marginBottom: 13 }]}>{selected?.description}</Text>{CATEGORIES.map(category => <Pressable accessibilityRole="button" key={category} onPress={() => chooseCategory(category as Category)} style={{ paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line }}><Text style={{ color: colors.ink, fontWeight: '600' }}>{category}</Text></Pressable>)}</View></Pressable></Modal>
    <Modal transparent visible={!!preview} animationType="slide" onRequestClose={() => { setPreview(null); setPendingCsv(null); }}><View style={{ flex: 1, backgroundColor: '#0D173455', justifyContent: 'flex-end' }}><View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, maxHeight: '85%' }}><Text style={styles.sectionTitle}>Review bank import</Text><Text style={[styles.subtitle, { marginBottom: 15 }]}>{preview?.rows.length} debit rows found · {preview?.duplicates} overlapping records skipped · {preview?.additions.length} new expenses</Text>{preview?.additions.slice(0, 5).map((t, index) => <View key={`${t.date}-${index}`} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.line, flexDirection: 'row', justifyContent: 'space-between' }}><Text numberOfLines={1} style={{ color: colors.ink, flex: 1 }}>{t.date} · {t.description}</Text><Text style={{ color: colors.ink, fontWeight: '700' }}>{formatRupees(t.amountPaise)}</Text></View>)}{(preview?.additions.length ?? 0) > 5 ? <Text style={[styles.subtitle, { marginBottom: 8 }]}>+ {(preview?.additions.length ?? 0) - 5} more new expenses</Text> : null}<View style={{ height: 16 }} /><Pressable accessibilityRole="button" onPress={confirmImport} disabled={!preview?.additions.length} style={[styles.button, !preview?.additions.length && { opacity: .5 }]}><Text style={styles.buttonText}>Import {preview?.additions.length ?? 0} expenses</Text></Pressable><Pressable accessibilityRole="button" onPress={() => { setPreview(null); setPendingCsv(null); }} style={{ padding: 14, alignItems: 'center' }}><Text style={{ color: colors.teal, fontWeight: '700' }}>Cancel</Text></Pressable></View></View></Modal>
  </SafeAreaView>;
}
