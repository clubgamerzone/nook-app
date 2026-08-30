import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from '@react-native-firebase/firestore';

import type {ChatMessage, MessageRetentionSeconds} from '../domain/models';

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

    let latestMessages: Array<{expiresAt?: Date; message: ChatMessage}> = [];
    const emitVisibleMessages = () => {
      const now = Date.now();
      listener(
        latestMessages.filter(item => !item.expiresAt || item.expiresAt.getTime() > now).map(item => item.message),
      );
    };
    const expiryTimer = setInterval(emitVisibleMessages, 30_000);

    const unsubscribe = onSnapshot(
      messagesQuery,
      snapshot => {
        latestMessages = snapshot.docs.map(messageSnapshot => {
          const data = messageSnapshot.data();
          const createdAt = data.createdAt as {toDate?: () => Date} | undefined;
          const expiresAt = data.expiresAt as {toDate?: () => Date} | null | undefined;
          const outgoing = data.senderUid === currentUid;

          return {
            expiresAt: expiresAt?.toDate?.(),
            message: {
              body: String(data.body ?? ''),
              conversationId,
              createdAt: createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
              delivery: outgoing ? (messageSnapshot.metadata.hasPendingWrites ? 'sending' : 'delivered') : 'delivered',
              expiresAt: expiresAt?.toDate?.().toISOString(),
              id: messageSnapshot.id,
              sender: outgoing ? 'me' : 'contact',
            },
          };
        });
        emitVisibleMessages();
      },
      onError,
    );

    return () => {
      clearInterval(expiryTimer);
      unsubscribe();
    };
  }

  subscribeRetention(
    conversationId: string,
    listener: (seconds: MessageRetentionSeconds) => void,
    onError: (error: Error) => void,
  ) {
    return onSnapshot(
      doc(getFirestore(), 'conversations', conversationId),
      snapshot => {
        listener(Number(snapshot.data()?.messageRetentionSeconds ?? 0) as MessageRetentionSeconds);
      },
      onError,
    );
  }

  async updateRetention(conversationId: string, currentUid: string, seconds: MessageRetentionSeconds) {
    await updateDoc(doc(getFirestore(), 'conversations', conversationId), {
      messageRetentionSeconds: seconds,
      retentionUpdatedAt: serverTimestamp(),
      retentionUpdatedBy: currentUid,
    });
  }

  async sendText(conversationId: string, currentUid: string, body: string) {
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      return;
    }

    const conversationSnapshot = await getDoc(doc(getFirestore(), 'conversations', conversationId));
    const currentRetention = Number(
      conversationSnapshot.data()?.messageRetentionSeconds ?? 0,
    ) as MessageRetentionSeconds;
    const expiresAt = currentRetention ? Timestamp.fromDate(new Date(Date.now() + currentRetention * 1000)) : null;

    await addDoc(collection(getFirestore(), 'conversations', conversationId, 'messages'), {
      body: trimmedBody,
      createdAt: serverTimestamp(),
      expiresAt,
      kind: 'text',
      retentionSeconds: currentRetention,
      senderUid: currentUid,
    });
  }
}
