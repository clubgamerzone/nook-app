import notifee, {AndroidImportance, RepeatFrequency, TriggerType} from '@notifee/react-native';

import type {OrganizerItem} from '../domain/models';

const CHANNEL_ID = 'nook-organizer';

export class OrganizerNotificationService {
  async requestPermission() {
    await notifee.requestPermission();
    await notifee.createChannel({
      id: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      name: 'Organizer reminders',
    });
  }

  async synchronize(item: OrganizerItem) {
    await this.cancel(item.id);
    if (!item.active || item.completed || !item.scheduledAt || item.type === 'note') {
      return;
    }

    const timestamp = new Date(item.scheduledAt).getTime();
    if (!Number.isFinite(timestamp) || timestamp <= Date.now()) {
      return;
    }

    await notifee.createTriggerNotification(
      {
        android: {channelId: CHANNEL_ID, pressAction: {id: 'default'}, smallIcon: 'ic_launcher'},
        body: this.body(item),
        data: {organizerItemId: item.id},
        id: item.id,
        title: item.title,
      },
      {
        repeatFrequency:
          item.repeat === 'daily'
            ? RepeatFrequency.DAILY
            : item.repeat === 'weekly'
            ? RepeatFrequency.WEEKLY
            : undefined,
        timestamp,
        type: TriggerType.TIMESTAMP,
      },
    );
  }

  async cancel(itemId: string) {
    await notifee.cancelNotification(itemId);
  }

  private body(item: OrganizerItem) {
    if (item.type === 'medicine') {
      return item.dosage ? `Medicine reminder · ${item.dosage}` : 'Medicine reminder';
    }
    if (item.type === 'appointment') {
      return item.location ? `Appointment · ${item.location}` : 'Appointment reminder';
    }
    return item.details || 'Nook reminder';
  }
}
