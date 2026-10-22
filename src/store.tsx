import Storage from 'expo-sqlite/kv-store';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { AppData, Category, emptyData, fingerprint, merchantName, previewImport, Profile, Transaction } from './finance';
import { askForReminders, scheduleReminders } from './reminders';

type Store = {
  data: AppData;
  loading: boolean;
  error: string | null;
  saveProfile: (profile: Profile) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'source'>) => void;
  importCsv: (csv: string) => { added: number; duplicates: number };
  previewCsv: (csv: string) => ReturnType<typeof previewImport>;
  setCategory: (id: string, category: Category) => void;
  setMerchantRule: (description: string, category: Category) => void;
  removeTransaction: (id: string) => void;
  setReminders: (enabled: boolean) => Promise<boolean>;
};
const Context = createContext<Store | null>(null);
const KEY = 'din-mobile-v1';
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function DinProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queue = useRef(Promise.resolve());
  const reminderQueue = useRef(Promise.resolve());
  const latestData = useRef(data);
  latestData.current = data;
  useEffect(() => {
    Storage.getItem(KEY).then(raw => {
      if (!raw) return;
      const saved = JSON.parse(raw) as AppData;
      if (!Array.isArray(saved.transactions) || !saved.profile || !Number.isFinite(saved.profile.incomePaise)) throw new Error('Invalid saved data');
      setData({ ...saved, merchantRules: Array.isArray(saved.merchantRules) ? saved.merchantRules : [], importedFiles: Array.isArray(saved.importedFiles) ? saved.importedFiles : [] });
    }).catch(() => setError('Saved data could not be read. Din started empty.')).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (loading) return;
    queue.current = queue.current.catch(() => {}).then(() => Storage.setItem(KEY, JSON.stringify(data)).then(() => setError(null)).catch(() => setError('Din could not save your data on this phone.')));
    // Recalculate pending native notifications whenever recorded spending or settings change.
    reminderQueue.current = reminderQueue.current.catch(() => {}).then(() => scheduleReminders(data).catch(() => setError('Din could not schedule reminders. Check notification permission.')));
  }, [data, loading]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', status => {
      if (status === 'active' && !loading) reminderQueue.current = reminderQueue.current.catch(() => {}).then(() => scheduleReminders(latestData.current).catch(() => setError('Din could not schedule reminders.')));
    });
    return () => listener.remove();
  }, [loading]);
  const saveProfile = (profile: Profile) => setData(current => ({ ...current, profile }));
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'source'>) => setData(current => ({ ...current, transactions: [{ ...transaction, id: id(), source: 'manual' }, ...current.transactions] }));
  const previewCsv = (csv: string) => previewImport(csv, data.transactions, data.merchantRules);
  const importCsv = (csv: string) => {
    const hash = fingerprint(csv);
    if (data.importedFiles.includes(hash)) throw new Error('This exact CSV was already imported.');
    const preview = previewCsv(csv);
    const transactions = preview.additions.map(t => ({ ...t, id: id() }));
    setData(current => ({ ...current, transactions: [...transactions, ...current.transactions], importedFiles: [...current.importedFiles, hash] }));
    return { added: transactions.length, duplicates: preview.duplicates };
  };
  const setCategory = (transactionId: string, category: Category) => setData(current => ({ ...current, transactions: current.transactions.map(t => t.id === transactionId ? { ...t, category } : t) }));
  const setMerchantRule = (description: string, category: Category) => setData(current => { const merchant = merchantName(description); return { ...current, merchantRules: [...current.merchantRules.filter(rule => rule.merchant !== merchant), { merchant, category }], transactions: current.transactions.map(t => merchantName(t.description) === merchant ? { ...t, category } : t) }; });
  const removeTransaction = (transactionId: string) => setData(current => ({ ...current, transactions: current.transactions.filter(t => t.id !== transactionId) }));
  const setReminders = async (enabled: boolean) => {
    if (enabled && !(await askForReminders())) return false;
    setData(current => ({ ...current, remindersEnabled: enabled }));
    return true;
  };
  return <Context.Provider value={{ data, loading, error, saveProfile, addTransaction, importCsv, previewCsv, setCategory, setMerchantRule, removeTransaction, setReminders }}>{children}</Context.Provider>;
}

export function useDin() {
  const value = useContext(Context);
  if (!value) throw new Error('DinProvider is missing');
  return value;
}
