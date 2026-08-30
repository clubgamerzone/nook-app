import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';

import {
  DEFAULT_MESSAGE_RETENTION_SECONDS,
  MESSAGE_PAGE_SIZE,
  type ChatMessage,
  type MessageRetentionSeconds,
} from '../domain/models';

const DELETE_BATCH_SIZE = 200;

type ConversationState = {
  messageCount: number;
  retentionSeconds: MessageRetentionSeconds;
};

function messageFromSnapshot(
  conversationId: string,
  currentUid: string,
  messageSnapshot: {
    data: () => Record<string, unknown>;
    id: string;
    metadata?: { hasPendingWrites?: boolean };
  },
): { expiresAt?: Date; message: ChatMessage } {
  const data = messageSnapshot.data();
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  const expiresAt = data.expiresAt as
    | { toDate?: () => Date }
    | null
    | undefined;
  const outgoing = data.senderUid === currentUid;

  return {
    expiresAt: expiresAt?.toDate?.(),
    message: {
      body: String(data.body ?? ''),
      conversationId,
      createdAt:
        createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
      delivery: outgoing
        ? messageSnapshot.metadata?.hasPendingWrites
          ? 'sending'
          : 'delivered'
        : 'delivered',
      expiresAt: expiresAt?.toDate?.().toISOString(),
      id: messageSnapshot.id,
      sender: outgoing ? ('me' as const) : ('contact' as const),
    },
  };
}

/** Development-only plaintext transport. Replace bodies with audited ciphertext before release. */
export class FirebaseChatRepository {
  subscribeMessages(
    conversationId: string,
    currentUid: string,
    listener: (messages: ChatMessage[], hasMore: boolean) => void,
    onError: (error: Error) => void,
  ) {
    const messagesQuery = query(
      collection(getFirestore(), 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(MESSAGE_PAGE_SIZE),
    );

    let latestMessages: Array<{ expiresAt?: Date; message: ChatMessage }> = [];
    const emitVisibleMessages = () => {
      const now = Date.now();
      listener(
        latestMessages
          .filter(item => !item.expiresAt || item.expiresAt.getTime() > now)
          .map(item => item.message)
          .reverse(),
        latestMessages.length === MESSAGE_PAGE_SIZE,
      );
    };
    const expiryTimer = setInterval(emitVisibleMessages, 30_000);

    const unsubscribe = onSnapshot(
      messagesQuery,
      snapshot => {
        latestMessages = snapshot.docs.map(messageSnapshot =>
          messageFromSnapshot(conversationId, currentUid, messageSnapshot),
        );
        emitVisibleMessages();
      },
      onError,
    );

    return () => {
      clearInterval(expiryTimer);
      unsubscribe();
    };
  }

  async loadOlderMessages(
    conversationId: string,
    currentUid: string,
    beforeCreatedAt: string,
  ) {
    const olderQuery = query(
      collection(getFirestore(), 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      startAfter(Timestamp.fromDate(new Date(beforeCreatedAt))),
      limit(MESSAGE_PAGE_SIZE),
    );
    const snapshot = await getDocs(olderQuery);
    const now = Date.now();
    const messages = snapshot.docs
      .map(messageSnapshot =>
        messageFromSnapshot(conversationId, currentUid, messageSnapshot),
      )
      .filter(item => !item.expiresAt || item.expiresAt.getTime() > now)
      .map(item => item.message)
      .reverse();
    return { hasMore: snapshot.docs.length === MESSAGE_PAGE_SIZE, messages };
  }

  subscribeConversationState(
    conversationId: string,
    listener: (state: ConversationState) => void,
    onError: (error: Error) => void,
  ) {
    return onSnapshot(
      doc(getFirestore(), 'conversations', conversationId),
      snapshot =>
        listener({
          messageCount: Math.max(0, Number(snapshot.data()?.messageCount ?? 0)),
          retentionSeconds: Number(
            snapshot.data()?.messageRetentionSeconds ??
              DEFAULT_MESSAGE_RETENTION_SECONDS,
          ) as MessageRetentionSeconds,
        }),
      onError,
    );
  }

  async updateRetention(
    conversationId: string,
    currentUid: string,
    seconds: MessageRetentionSeconds,
  ) {
    await updateDoc(doc(getFirestore(), 'conversations', conversationId), {
      messageRetentionSeconds: seconds,
      retentionUpdatedAt: serverTimestamp(),
      retentionUpdatedBy: currentUid,
    });
  }

  async clearMessages(conversationId: string) {
    const database = getFirestore();
    const messages = collection(
      database,
      'conversations',
      conversationId,
      'messages',
    );

    while (true) {
      const snapshot = await getDocs(query(messages, limit(DELETE_BATCH_SIZE)));
      if (snapshot.empty) {
        return;
      }

      const batch = writeBatch(database);
      snapshot.docs.forEach(messageSnapshot =>
        batch.delete(messageSnapshot.ref),
      );
      await batch.commit();
    }
  }

  async sendText(conversationId: string, currentUid: string, body: string) {
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      return;
    }

    const conversationSnapshot = await getDoc(
      doc(getFirestore(), 'conversations', conversationId),
    );
    const currentRetention = Number(
      conversationSnapshot.data()?.messageRetentionSeconds ??
        DEFAULT_MESSAGE_RETENTION_SECONDS,
    ) as MessageRetentionSeconds;
    const expiresAt = currentRetention
      ? Timestamp.fromDate(new Date(Date.now() + currentRetention * 1000))
      : null;

    await addDoc(
      collection(getFirestore(), 'conversations', conversationId, 'messages'),
      {
        body: trimmedBody,
        createdAt: serverTimestamp(),
        expiresAt,
        kind: 'text',
        retentionSeconds: currentRetention,
        senderUid: currentUid,
      },
    );
  }
}
