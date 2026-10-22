export const CATEGORIES = ['Food', 'Groceries', 'Shopping', 'Subscriptions', 'UPI', 'Transport', 'Bills', 'Transfers', 'Other'] as const;
export type Category = typeof CATEGORIES[number];
export type Transaction = { id: string; date: string; description: string; amountPaise: number; category: Category; source: 'manual' | 'csv' };
export type Profile = { name: string; incomePaise: number; setAsidePaise: number; morningTime: string; eveningTime: string };
export type MerchantRule = { merchant: string; category: Category };
export type AppData = { profile: Profile; transactions: Transaction[]; importedFiles: string[]; remindersEnabled: boolean; merchantRules: MerchantRule[] };

export const emptyData = (): AppData => ({ profile: { name: '', incomePaise: 0, setAsidePaise: 0, morningTime: '08:00', eveningTime: '21:00' }, transactions: [], importedFiles: [], remindersEnabled: false, merchantRules: [] });
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const formatRupees = (paise: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
export const parseRupees = (raw: string) => {
  const value = Number(raw.trim().replace(/[₹,\s]/g, ''));
  if (!Number.isFinite(value) || value <= 0 || value > 10_000_000) throw new Error('Enter an amount between ₹0 and ₹1 crore.');
  return Math.round(value * 100);
};
export const dailyIncome = (profile: Profile) => Math.floor(profile.incomePaise / 30);
export const dailyAllowance = (profile: Profile) => Math.max(0, Math.floor((profile.incomePaise - profile.setAsidePaise) / 30));
export const spentOn = (transactions: Transaction[], day: string) => transactions.filter(t => t.date === day && t.category !== 'Transfers').reduce((sum, t) => sum + t.amountPaise, 0);
export const dailyReport = (data: AppData, day: string) => {
  const allowance = dailyAllowance(data.profile);
  const spent = spentOn(data.transactions, day);
  const categories = categoryTotals(data.transactions.filter(t => t.date === day));
  return { income: dailyIncome(data.profile), allowance, spent, remaining: allowance - spent, topCategory: categories[0]?.category ?? null };
};
export const categoryTotals = (transactions: Transaction[]) => {
  const sums = new Map<Category, number>();
  for (const t of transactions) if (t.category !== 'Transfers') sums.set(t.category, (sums.get(t.category) ?? 0) + t.amountPaise);
  return [...sums].map(([category, amountPaise]) => ({ category, amountPaise })).sort((a, b) => b.amountPaise - a.amountPaise);
};
export const monthTransactions = (transactions: Transaction[], day: string) => transactions.filter(t => t.date.startsWith(day.slice(0, 7)));
export const merchantName = (description: string) => description.toLowerCase().replace(/\b(?:upi|imps|neft|rtgs|txn|ref|payment|paid|to|from)\b/g, ' ').replace(/\b\d{4,}\b/g, ' ').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || description.toLowerCase().trim().slice(0, 60);
export const transactionKey = (t: Pick<Transaction, 'date' | 'description' | 'amountPaise'>) => `${t.date}|${t.amountPaise}|${merchantName(t.description)}`;
export function previewImport(csv: string, existing: Transaction[], rules: MerchantRule[] = []) {
  const rows = parseStatement(csv).map(t => ({ ...t, category: rules.find(r => r.merchant === merchantName(t.description))?.category ?? t.category }));
  const seen = new Map<string, number>();
  for (const t of existing) { const key = transactionKey(t); seen.set(key, (seen.get(key) ?? 0) + 1); }
  const candidates = new Map<string, number>();
  const additions = rows.filter(t => { const key = transactionKey(t); const count = (candidates.get(key) ?? 0) + 1; candidates.set(key, count); return count > (seen.get(key) ?? 0); });
  return { rows, additions, duplicates: rows.length - additions.length };
}
export function recurringMerchants(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) if (t.category !== 'Transfers') { const key = merchantName(t.description); groups.set(key, [...(groups.get(key) ?? []), t]); }
  return [...groups].map(([merchant, entries]) => ({ merchant, entries, months: new Set(entries.map(t => t.date.slice(0, 7))).size, last: entries.reduce((a, b) => a.date > b.date ? a : b) })).filter(item => item.months >= 2).sort((a, b) => b.last.date.localeCompare(a.last.date));
}
export function monthlyRecap(transactions: Transaction[], day: string) {
  const current = monthTransactions(transactions, day).filter(t => t.category !== 'Transfers');
  const previousDate = new Date(`${day.slice(0, 7)}-01T12:00:00Z`); previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
  const previous = monthTransactions(transactions, previousDate.toISOString().slice(0, 10)).filter(t => t.category !== 'Transfers');
  const total = (items: Transaction[]) => items.reduce((sum, t) => sum + t.amountPaise, 0);
  const merchants = new Map<string, number>();
  for (const t of current) { const name = merchantName(t.description); merchants.set(name, (merchants.get(name) ?? 0) + t.amountPaise); }
  return { spent: total(current), previousSpent: total(previous), previousCount: previous.length, topCategory: categoryTotals(current)[0] ?? null, topMerchants: [...merchants].map(([merchant, amountPaise]) => ({ merchant, amountPaise })).sort((a, b) => b.amountPaise - a.amountPaise).slice(0, 3), count: current.length };
}
export const morningMessage = (report: ReturnType<typeof dailyReport>) => `Good morning. Your income is ${formatRupees(report.income)} per day. After bills and savings, you can spend ${formatRupees(report.allowance)} today.`;
export const eveningMessage = (report: ReturnType<typeof dailyReport>) => `Today you recorded ${formatRupees(report.spent)} in spending. ${report.remaining < 0 ? `You are ${formatRupees(-report.remaining)} over` : `You have ${formatRupees(report.remaining)} left from`} your daily allowance.${report.topCategory ? ` Your biggest category was ${report.topCategory}.` : ''}`;

export function categorize(description: string): Category {
  const text = description.toLowerCase();
  if (/swiggy|zomato|coffee|cafe|restaurant|blue tokai/.test(text)) return 'Food';
  if (/blinkit|zepto|bigbasket|grocery|mart/.test(text)) return 'Groceries';
  if (/amazon|flipkart|myntra|shopping/.test(text)) return 'Shopping';
  if (/netflix|spotify|prime|subscription/.test(text)) return 'Subscriptions';
  if (/uber|ola|metro|fuel|petrol/.test(text)) return 'Transport';
  if (/rent|electricity|water|broadband|mobile bill/.test(text)) return 'Bills';
  if (/transfer|self|own account/.test(text)) return 'Transfers';
  if (/upi|vpa/.test(text)) return 'UPI';
  return 'Other';
}

function csvRows(csv: string): string[][] {
  const sample = csv.split(/\r?\n/).slice(0, 10).join('\n');
  const delimiter = (sample.match(/;/g)?.length ?? 0) > (sample.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"' && quoted && csv[i + 1] === '"') { field += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && csv[i + 1] === '\n') i++; row.push(field); if (row.some(c => c.trim())) rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (quoted) throw new Error('The CSV has an unclosed quote.');
  row.push(field); if (row.some(c => c.trim())) rows.push(row);
  return rows;
}

function parseDate(raw: string): string | null {
  const value = raw.trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : (() => { const m = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; const short = value.match(/^(\d{1,2})[ -]([a-z]{3})[ -](\d{4})$/i); if (!short) return null; const month = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(short[2].toLowerCase()) + 1; return month ? `${short[3]}-${String(month).padStart(2, '0')}-${short[1].padStart(2, '0')}` : null; })();
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== iso ? null : iso;
}

export function parseStatement(csv: string): Omit<Transaction, 'id'>[] {
  const rows = csvRows(csv);
  if (rows.length < 2) throw new Error('CSV needs a header and at least one row.');
  const normalizeHeader = (value: string) => value.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const headerIndex = rows.findIndex(row => { const headers = row.map(normalizeHeader); return headers.some(h => /^(date|transaction date|txn date|value date|posted date)$/.test(h)) && headers.some(h => /^(description|narration|merchant|details|transaction details|particulars|remarks)$/.test(h)); });
  if (headerIndex < 0 || headerIndex >= rows.length - 1) throw new Error('CSV needs Date, Description, and Debit or Amount columns.');
  const headers = rows[headerIndex].map(normalizeHeader);
  const col = (names: string[]) => headers.findIndex(h => names.some(n => h === n || h === `${n} inr` || h === `${n} rs` || h === `${n} amt`));
  const dateCol = col(['date', 'transaction date', 'txn date', 'value date', 'posted date']);
  const descCol = col(['description', 'narration', 'merchant', 'details', 'transaction details', 'particulars', 'remarks']);
  const debitCol = col(['debit', 'debit amount', 'withdrawal', 'withdrawal amt', 'withdrawal amount', 'withdrawals', 'dr']);
  const amountCol = col(['amount', 'transaction amount', 'txn amount']);
  const typeCol = col(['type', 'dr cr', 'transaction type', 'debit credit']);
  const creditCol = col(['credit', 'credit amount', 'deposit', 'deposit amount', 'cr']);
  if (dateCol < 0 || descCol < 0 || (debitCol < 0 && amountCol < 0)) throw new Error('CSV needs Date, Description, and Debit or Amount columns.');
  const result: Omit<Transaction, 'id'>[] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    if (typeCol >= 0 && /^(credit|cr|deposit)$/i.test((row[typeCol] ?? '').trim())) continue;
    const date = parseDate(row[dateCol] ?? '');
    const description = (row[descCol] ?? '').trim().slice(0, 100);
    const raw = row[debitCol >= 0 ? debitCol : amountCol] ?? '';
    if (debitCol < 0 && creditCol >= 0 && (row[creditCol] ?? '').trim()) continue;
    if (!date || !description || !raw.trim()) continue;
    if (/\b(?:cr|credit)\s*$/i.test(raw)) continue;
    try { result.push({ date, description, amountPaise: parseRupees(raw.replace(/\b(?:dr|debit)\s*$/i, '').replace(/^-/, '')), category: categorize(description), source: 'csv' }); }
    catch { /* Skip credit, empty, or invalid amounts. */ }
  }
  if (!result.length) throw new Error('No valid debit transactions found.');
  return result;
}

export function fingerprint(content: string): string {
  let hash = 2166136261;
  for (let i = 0; i < content.length; i++) hash = Math.imul(hash ^ content.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}
