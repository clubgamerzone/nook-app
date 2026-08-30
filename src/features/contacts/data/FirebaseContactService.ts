import {
  collection,
  getFirestore,
  onSnapshot,
} from '@react-native-firebase/firestore';

import type {Contact} from '../domain/models';

export class FirebaseContactService {
  subscribe(
    uid: string,
    listener: (contacts: Contact[]) => void,
    onError: (error: Error) => void,
  ) {
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
}
