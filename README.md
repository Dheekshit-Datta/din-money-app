# Din for Android and iPhone

Din is a React Native app built with Expo. It has **three separate screens**: Home, Activity, and Plan. It starts with no sample transactions.

## Run it on a phone

1. Install Node.js 22 or newer on the development computer and **Expo Go** on the Android or iPhone.
2. In this folder run `npm install` and then `npx expo start --tunnel`.
3. Scan the QR code with Expo Go. On iPhone, the Camera app can open the QR code.
4. Open **Plan** to enter monthly take-home income, bills and savings, and reminder times. Tap **Enable phone reminders** and grant notification permission.
5. Open **Activity** to add expenses or import a bank CSV. Review the new rows and overlaps before confirming. The Home budget and categories update immediately.

The app saves transactions on the phone using Expo SQLite. The calculation uses a 30-day pace: income ÷ 30, and `(income - bills and savings) ÷ 30 - today's recorded expenses`. Transfers between your own accounts are excluded from spending totals. Activity has transaction search, category editing, and deletion. When you edit a category, you can save a merchant rule for all matching entries and future imports. Home shows a monthly recap, top merchants, and merchants seen in two or more months as possible recurring payments. Review those recurring suggestions; they are inferred from descriptions and may not be subscriptions.

Morning and evening **local notifications** are scheduled for the next 30 days, so they can appear after the app closes. Pending notifications are recalculated when the app is opened or a transaction changes. An evening notification uses the spending recorded when it was last scheduled; without live bank data, it cannot include purchases the app never received. Android may delay a reminder because of device battery settings.

## Bank CSV format

Use a CSV with `Date`, `Description`, and `Debit` headers. Din also recognizes common variants such as `Transaction Date`, `Particulars`, `Narration`, `Withdrawal Amount`, and `Amount (INR)`, including CSVs with a few preamble lines and semicolon separators. Dates can be `DD/MM/YYYY`, `YYYY-MM-DD`, or `DD-MMM-YYYY`. PDF and Excel workbook files are not supported.

```csv
Date,Description,Debit
22/10/2026,Coffee,250
22/10/2026,Groceries,600
```

An `Amount` column also works. Add a `Type` or `DR/CR` column with `Debit`/`DR` or `Credit`/`CR` to exclude credits. Without a credit marker, positive amounts are treated as expenses, so use that layout only for expense-only CSVs. Before confirmation, Din shows how many debit rows are new and how many overlap with saved transactions. Overlap detection compares date, amount, and normalized merchant description; identical same-day payments can sometimes look like duplicates, so check the preview. The exact same file is blocked from being imported twice.

## What still needs external access

**Automatic bank/UPI connection is not active.** The Account Aggregator flow requires an eligible regulated Financial Information User or partner, an Account Aggregator provider, consent handling, and a secure backend. There are no fake bank connections or bank credentials in this project. CSV import and manual recording are the real data sources available now.

This repository is source code, not a signed APK or IPA. Android standalone builds need a configured Android build environment or Expo EAS account. iPhone standalone builds need Apple Developer signing. Expo Go runs this project on both platforms for development.

## Checks

- `node --experimental-strip-types src/finance.test.mjs`
- `npx tsc --noEmit`
- `npx expo export --platform android`
- `npx expo export --platform ios`

Financial data remains in the phone's app sandbox. This prototype does not yet add app-level database encryption, backup, authentication, or a security review required before public launch.
