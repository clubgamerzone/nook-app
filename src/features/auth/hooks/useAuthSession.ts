import {useCallback, useEffect, useMemo, useState} from 'react';

import {FirebaseAuthService} from '../data/FirebaseAuthService';
import type {AuthUser} from '../domain/AuthService';

export function useAuthSession() {
  const service = useMemo(() => new FirebaseAuthService(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(
    () =>
      service.subscribe(nextUser => {
        setUser(nextUser);
        setInitializing(false);
      }),
    [service],
  );

  const createAccount = useCallback(
    (email: string, password: string) => service.createAccount(email, password),
    [service],
  );

  const signIn = useCallback((email: string, password: string) => service.signIn(email, password), [service]);

  const endSession = useCallback(() => service.signOut(), [service]);
  const deleteAccount = useCallback((password: string) => service.deleteAccount(password), [service]);

  return {createAccount, deleteAccount, endSession, initializing, signIn, user};
}
