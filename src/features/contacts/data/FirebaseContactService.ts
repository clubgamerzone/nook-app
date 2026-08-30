import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from '@react-native-firebase/firestore';

import type {Contact} from '../domain/models';

export class FirebaseContactService {
  subscribe(uid: string, listener: (contacts: Contact[]) => void, onError: (error: Error) => void) {
    return onSnapshot(
      collection(getFirestore(), 'users', uid, 'contacts'),
      snapshot => {
        listener(
          snapshot.docs
            .map(contactSnapshot => {
              const data = contactSnapshot.data();
              const acceptedAt = data.acceptedAt as {toDate?: () => Date} | undefined;
              return {
                acceptedAt: acceptedAt?.toDate?.().toISOString() ?? new Date(0).toISOString(),
                blocked: data.blocked === true,
                contactUid: contactSnapshot.id,
                conversationId: String(data.conversationId ?? ''),
                displayName: String(data.displayName ?? ''),
              };
            })
            .filter(contact => contact.conversationId && contact.displayName)
            .sort((left, right) => left.displayName.localeCompare(right.displayName)),
        );
      },
      onError,
    );
  }

  async setBlocked(uid: string, contactUid: string, blocked: boolean) {
    await updateDoc(doc(getFirestore(), 'users', uid, 'contacts', contactUid), {
      blocked,
      blockedAt: blocked ? serverTimestamp() : null,
    });
  }

  async remove(uid: string, contactUid: string) {
    await deleteDoc(doc(getFirestore(), 'users', uid, 'contacts', contactUid));
  }

  async report(uid: string, contactUid: string, conversationId: string, reason: string) {
    await addDoc(collection(getFirestore(), 'reports'), {
      conversationId,
      createdAt: serverTimestamp(),
      reason,
      reportedUid: contactUid,
      reporterUid: uid,
      status: 'received',
    });
  }
}
