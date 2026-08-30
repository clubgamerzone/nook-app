import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';

import type {AuthService, AuthUser} from '../domain/AuthService';
import {AccountDeletionService} from '../../../services/account/AccountDeletionService';

export class FirebaseAuthService implements AuthService {
  private readonly accountDeletion = new AccountDeletionService();
  subscribe(listener: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(getAuth(), user => {
      listener(user ? {uid: user.uid, email: user.email} : null);
    });
  }

  async createAccount(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(getAuth(), email.trim(), password);
  }

  async signIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(getAuth(), email.trim(), password);
  }

  async deleteAccount(password: string): Promise<void> {
    await this.accountDeletion.delete(password);
  }

  async signOut(): Promise<void> {
    await signOut(getAuth());
  }
}
