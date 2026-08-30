import {useCallback, useEffect, useMemo, useState} from 'react';

import {FirebaseProfileService} from '../data/FirebaseProfileService';
import type {UserProfile} from '../domain/models';

export function useUserProfile(uid: string) {
  const service = useMemo(() => new FirebaseProfileService(), []);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(
    () =>
      service.subscribe(
        uid,
        nextProfile => {
          setProfile(nextProfile);
          setError(undefined);
          setLoading(false);
        },
        () => {
          setError('Nook could not load your profile. Check your connection and try again.');
          setLoading(false);
        },
      ),
    [service, uid],
  );

  const createProfile = useCallback(
    (displayName: string) => service.create(uid, displayName),
    [service, uid],
  );

  return {createProfile, error, loading, profile};
}
