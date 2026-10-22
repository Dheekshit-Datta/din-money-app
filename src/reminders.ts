import * as Notifications from 'expo-notifications';
import { AppData, dailyReport, eveningMessage, localDate, morningMessage } from './finance';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const atTime = (date: Date, time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

export async function askForReminders(): Promise<boolean> {
  await Notifications.setNotificationChannelAsync('daily', { name: 'Daily money check-ins', importance: Notifications.AndroidImportance.DEFAULT });
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function scheduleReminders(data: AppData): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!data.remindersEnabled || !data.profile.incomePaise) return;
  await Notifications.setNotificationChannelAsync('daily', { name: 'Daily money check-ins', importance: Notifications.AndroidImportance.DEFAULT });
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const date = localDate(day);
    const report = dailyReport(data, date);
    const morning = atTime(day, data.profile.morningTime);
    const evening = atTime(day, data.profile.eveningTime);
    if (morning > now) await Notifications.scheduleNotificationAsync({
      content: { title: 'Din · your daily budget', body: morningMessage(report) },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: morning, channelId: 'daily' },
    });
    if (evening > now) await Notifications.scheduleNotificationAsync({
      content: { title: 'Din · tonight’s recap', body: i === 0 || data.transactions.some(t => t.date === date) ? eveningMessage(report) : 'Open Din to record today’s expenses and see where your money went.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: evening, channelId: 'daily' },
    });
  }
}
