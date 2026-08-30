import AsyncStorage from '@react-native-async-storage/async-storage';

import type {OrganizerDraft, OrganizerItem} from '../domain/models';

function storageKey(uid: string) {
  return `@nook:organizer:${uid}`;
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class OrganizerRepository {
  async list(uid: string): Promise<OrganizerItem[]> {
    const serialized = await AsyncStorage.getItem(storageKey(uid));
    if (!serialized) {
      return [];
    }
    try {
      const items = JSON.parse(serialized) as OrganizerItem[];
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  async create(uid: string, draft: OrganizerDraft) {
    const now = new Date().toISOString();
    const item: OrganizerItem = {
      ...draft,
      completed: false,
      createdAt: now,
      id: createId(),
      updatedAt: now,
    };
    const items = [item, ...(await this.list(uid))];
    await this.save(uid, items);
    return item;
  }

  async update(uid: string, item: OrganizerItem) {
    const items = (await this.list(uid)).map(current =>
      current.id === item.id ? {...item, updatedAt: new Date().toISOString()} : current,
    );
    await this.save(uid, items);
  }

  async remove(uid: string, itemId: string) {
    await this.save(
      uid,
      (await this.list(uid)).filter(item => item.id !== itemId),
    );
  }

  async clear(uid: string) {
    await AsyncStorage.removeItem(storageKey(uid));
  }

  private async save(uid: string, items: OrganizerItem[]) {
    await AsyncStorage.setItem(storageKey(uid), JSON.stringify(items));
  }
}
