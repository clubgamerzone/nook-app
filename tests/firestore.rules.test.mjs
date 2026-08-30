import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

import {assertFails, assertSucceeds, initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {addDoc, collection, doc, serverTimestamp, setDoc, updateDoc} from 'firebase/firestore';

let environment;

before(async () => {
  environment = await initializeTestEnvironment({
    firestore: {rules: readFileSync('firestore.rules', 'utf8')},
    projectId: 'nook-rules-test',
  });
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context => {
    const database = context.firestore();
    await setDoc(doc(database, 'users/alice'), {displayName: 'Alice'});
    await setDoc(doc(database, 'users/bob'), {displayName: 'Bob'});
    await setDoc(doc(database, 'conversations/conversation-1'), {
      messageRetentionSeconds: 0,
      participantIds: ['alice', 'bob'],
    });
    await setDoc(doc(database, 'users/alice/contacts/bob'), {
      contactUid: 'bob',
      conversationId: 'conversation-1',
      displayName: 'Bob',
      ownerUid: 'alice',
    });
    await setDoc(doc(database, 'users/bob/contacts/alice'), {
      contactUid: 'alice',
      conversationId: 'conversation-1',
      displayName: 'Alice',
      ownerUid: 'bob',
    });
  });
});

after(async () => environment?.cleanup());

test('participants can message until either contact blocks the relationship', async () => {
  const alice = environment.authenticatedContext('alice').firestore();
  const bob = environment.authenticatedContext('bob').firestore();

  await assertSucceeds(
    addDoc(collection(alice, 'conversations/conversation-1/messages'), {
      body: 'Hello',
      createdAt: serverTimestamp(),
      expiresAt: null,
      kind: 'text',
      retentionSeconds: 0,
      senderUid: 'alice',
    }),
  );

  await assertSucceeds(
    updateDoc(doc(alice, 'users/alice/contacts/bob'), {
      blocked: true,
      blockedAt: serverTimestamp(),
    }),
  );

  await assertFails(
    addDoc(collection(bob, 'conversations/conversation-1/messages'), {
      body: 'This must be rejected',
      createdAt: serverTimestamp(),
      expiresAt: null,
      kind: 'text',
      retentionSeconds: 0,
      senderUid: 'bob',
    }),
  );
});

test('a participant can submit a metadata-only safety report', async () => {
  const alice = environment.authenticatedContext('alice').firestore();
  const report = await assertSucceeds(
    addDoc(collection(alice, 'reports'), {
      conversationId: 'conversation-1',
      createdAt: serverTimestamp(),
      reason: 'harassment',
      reportedUid: 'bob',
      reporterUid: 'alice',
      status: 'received',
    }),
  );
  assert.ok(report.id);
});
