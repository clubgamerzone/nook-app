import {
  addDoc,
  collection,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from '@react-native-firebase/firestore';

import type {ChatMessage} from '../domain/models';

const MESSAGE_LIMIT = 200;

/** Development-only plaintext transport. Replace bodies with audited ciphertext before release. */
export class FirebaseChatRepository {
  subscribeMessages(
    conversationId: string,
    currentUid: string,
    listener: (messages: ChatMessage[]) => void,
    onError: (error: Error) => void,
  ) {
    const messagesQuery = query(
      collection(getFirestore(), 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(MESSAGE_LIMIT),
    );

    return onSnapshot(
      messagesQuery,
      snapshot => {
        listener(
          snapshot.docs.map(messageSnapshot => {
            const data = messageSnapshot.data();
            const createdAt = data.createdAt as {toDate?: () => Date} | undefined;
            const outgoing = data.senderUid === currentUid;

            return {
              body: String(data.body ?? ''),
              conversationId,
              createdAt: createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
              delivery: outgoing ? (messageSnapshot.metadata.hasPendingWrites ? 'sending' : 'delivered') : 'delivered',
              id: messageSnapshot.id,
              sender: outgoing ? 'me' : 'contact',
            };
          }),
        );
      },
      onError,
    );
  }

  async sendText(conversationId: string, currentUid: string, body: string) {
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      return;
    }

    await addDoc(collection(getFirestore(), 'conversations', conversationId, 'messages'), {
      body: trimmedBody,
      createdAt: serverTimestamp(),
      kind: 'text',
      senderUid: currentUid,
    });
  }
}
