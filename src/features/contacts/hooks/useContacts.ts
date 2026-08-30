import {useCallback, useEffect, useMemo, useState} from 'react';

import {FirebaseContactService} from '../data/FirebaseContactService';
import type {Contact} from '../domain/models';

export function useContacts(uid: string) {
  const service = useMemo(() => new FirebaseContactService(), []);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(
    () =>
      service.subscribe(
        uid,
        nextContacts => {
          setContacts(nextContacts);
          setError(undefined);
          setLoading(false);
        },
        () => {
          setError('Nook could not load your contacts.');
          setLoading(false);
        },
      ),
    [service, uid],
  );

  const setBlocked = useCallback(
    (contactUid: string, blocked: boolean) => service.setBlocked(uid, contactUid, blocked),
    [service, uid],
  );
  const remove = useCallback((contactUid: string) => service.remove(uid, contactUid), [service, uid]);
  const report = useCallback(
    (contactUid: string, conversationId: string, reason: string) =>
      service.report(uid, contactUid, conversationId, reason),
    [service, uid],
  );

  return {contacts, error, loading, remove, report, setBlocked};
}
