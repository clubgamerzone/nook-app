import {
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';

import type {UserProfile} from '../domain/models';

export class FirebaseProfileService {
  subscribe(
    uid: string,
    listener: (profile: UserProfile | null) => void,
    onError: (error: Error) => void,
  ) {
    return onSnapshot(
      doc(getFirestore(), 'users', uid),
      snapshot => {
        const data = snapshot.data();
        listener(
          snapshot.exists() && typeof data?.displayName === 'string'
            ? {uid, displayName: data.displayName}
            : null,
        );
      },
      onError,
    );
  }

  async create(uid: string, displayName: string) {
    const normalizedName = displayName.trim().replace(/\s+/g, ' ');
    await setDoc(doc(getFirestore(), 'users', uid), {
      displayName: normalizedName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
