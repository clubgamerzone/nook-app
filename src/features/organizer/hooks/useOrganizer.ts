import {useCallback, useEffect, useMemo, useState} from 'react';

import {OrganizerRepository} from '../data/OrganizerRepository';
import type {OrganizerDraft, OrganizerItem} from '../domain/models';
import {OrganizerNotificationService} from '../services/OrganizerNotificationService';

export function useOrganizer(uid: string) {
  const repository = useMemo(() => new OrganizerRepository(), []);
  const notifications = useMemo(() => new OrganizerNotificationService(), []);
  const [items, setItems] = useState<OrganizerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const reload = useCallback(async () => {
    try {
      setItems(await repository.list(uid));
      setError(undefined);
    } catch {
      setError('Your organizer could not be loaded on this device.');
    } finally {
      setLoading(false);
    }
  }, [repository, uid]);

  useEffect(() => {
    reload().catch(() => undefined);
  }, [reload]);

  const create = useCallback(
    async (draft: OrganizerDraft) => {
      const item = await repository.create(uid, draft);
      try {
        await notifications.requestPermission();
        await notifications.synchronize(item);
      } catch {
        setError('The item was saved, but its device alert could not be scheduled.');
      }
      await reload();
    },
    [notifications, reload, repository, uid],
  );

  const update = useCallback(
    async (item: OrganizerItem) => {
      await repository.update(uid, item);
      try {
        await notifications.synchronize(item);
      } catch {
        setError('The item was updated, but its device alert could not be changed.');
      }
      await reload();
    },
    [notifications, reload, repository, uid],
  );

  const remove = useCallback(
    async (item: OrganizerItem) => {
      await repository.remove(uid, item.id);
      await notifications.cancel(item.id).catch(() => undefined);
      await reload();
    },
    [notifications, reload, repository, uid],
  );

  const clear = useCallback(async () => {
    await Promise.all(items.map(item => notifications.cancel(item.id).catch(() => undefined)));
    await repository.clear(uid);
    await reload();
  }, [items, notifications, reload, repository, uid]);

  return {clear, create, error, items, loading, remove, update};
}
