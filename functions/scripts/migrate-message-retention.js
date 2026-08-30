const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const DEFAULT_RETENTION_SECONDS = 604800;
const MAX_CONVERSATION_MESSAGES = 2500;
const WRITE_BATCH_SIZE = 400;

initializeApp({ credential: applicationDefault(), projectId: 'nook-73e02' });

async function commitUpdates(database, updates) {
  for (let index = 0; index < updates.length; index += WRITE_BATCH_SIZE) {
    const batch = database.batch();
    updates.slice(index, index + WRITE_BATCH_SIZE).forEach(update => {
      if (update.delete) {
        batch.delete(update.ref);
      } else {
        batch.update(update.ref, update.data);
      }
    });
    await batch.commit();
  }
}

async function migrate() {
  const database = getFirestore();
  const conversations = await database.collection('conversations').get();
  let migratedMessages = 0;
  let deletedMessages = 0;

  for (const conversation of conversations.docs) {
    const messagesRef = conversation.ref.collection('messages');
    const messages = await messagesRef.orderBy('createdAt', 'asc').get();
    const overflow = Math.max(0, messages.size - MAX_CONVERSATION_MESSAGES);
    const updates = [];

    messages.docs.forEach((message, index) => {
      if (index < overflow) {
        updates.push({ delete: true, ref: message.ref });
        deletedMessages += 1;
        return;
      }
      const data = message.data();
      if (!data.expiresAt) {
        const createdAt = data.createdAt?.toDate?.() ?? new Date();
        updates.push({
          data: {
            expiresAt: Timestamp.fromDate(
              new Date(createdAt.getTime() + DEFAULT_RETENTION_SECONDS * 1000),
            ),
            retentionSeconds: DEFAULT_RETENTION_SECONDS,
          },
          ref: message.ref,
        });
        migratedMessages += 1;
      }
    });

    await commitUpdates(database, updates);
    await conversation.ref.set(
      {
        messageCount: Math.min(messages.size, MAX_CONVERSATION_MESSAGES),
        messageRetentionSeconds: DEFAULT_RETENTION_SECONDS,
      },
      { merge: true },
    );
  }

  process.stdout.write(
    `Migrated ${conversations.size} conversations, updated ${migratedMessages} messages, deleted ${deletedMessages} overflow messages.\n`,
  );
}

migrate().catch(error => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
