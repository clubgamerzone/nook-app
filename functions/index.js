const {
  onDocumentCreated,
  onDocumentDeleted,
} = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

initializeApp();

const MAX_CONVERSATION_MESSAGES = 2500;

exports.enforceConversationMessageLimit = onDocumentCreated(
  {
    document: 'conversations/{conversationId}/messages/{messageId}',
    maxInstances: 20,
    region: 'us-central1',
    retry: true,
  },
  async event => {
    const database = getFirestore();
    const conversationRef = database.doc(
      `conversations/${event.params.conversationId}`,
    );
    let updatedCount = 0;

    await database.runTransaction(async transaction => {
      const conversation = await transaction.get(conversationRef);
      const currentCount = Math.max(
        0,
        Number(conversation.data()?.messageCount ?? 0),
      );
      updatedCount = currentCount + 1;
      transaction.set(
        conversationRef,
        {
          messageCount: updatedCount,
          messageCountUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    if (updatedCount <= MAX_CONVERSATION_MESSAGES) {
      return;
    }

    const overflow = updatedCount - MAX_CONVERSATION_MESSAGES;
    const oldestMessages = await conversationRef
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .limit(overflow)
      .get();
    const writer = database.bulkWriter();
    oldestMessages.docs.forEach(message => writer.delete(message.ref));
    await writer.close();
  },
);

exports.trackConversationMessageDeletion = onDocumentDeleted(
  {
    document: 'conversations/{conversationId}/messages/{messageId}',
    maxInstances: 20,
    region: 'us-central1',
    retry: true,
  },
  async event => {
    const database = getFirestore();
    const conversationRef = database.doc(
      `conversations/${event.params.conversationId}`,
    );
    await database.runTransaction(async transaction => {
      const conversation = await transaction.get(conversationRef);
      if (!conversation.exists) {
        return;
      }
      const currentCount = Math.max(
        0,
        Number(conversation.data()?.messageCount ?? 0),
      );
      transaction.update(conversationRef, {
        messageCount: Math.max(0, currentCount - 1),
        messageCountUpdatedAt: FieldValue.serverTimestamp(),
      });
    });
  },
);
