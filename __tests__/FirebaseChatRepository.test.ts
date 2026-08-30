jest.mock('@react-native-firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(() => ({ id: 'messages' })),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(() => ({ id: 'database' })),
  limit: jest.fn(value => ({ value })),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(value => value),
  serverTimestamp: jest.fn(),
  startAfter: jest.fn(value => ({ value })),
  Timestamp: { fromDate: jest.fn(), fromMillis: jest.fn() },
  updateDoc: jest.fn(),
  writeBatch: jest.fn(),
}));

import {
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  writeBatch,
} from '@react-native-firebase/firestore';

import { FirebaseChatRepository } from '../src/features/chat/data/FirebaseChatRepository';

test('subscribes to the newest 100 messages and presents them chronologically', () => {
  const older = new Date('2026-08-30T10:00:00.000Z');
  const newer = new Date('2026-08-30T10:01:00.000Z');
  (onSnapshot as jest.Mock).mockImplementation((_query, listener) => {
    listener({
      docs: [
        {
          data: () => ({
            body: 'Newer',
            createdAt: { toDate: () => newer },
            senderUid: 'bob',
          }),
          id: 'newer',
          metadata: { hasPendingWrites: false },
        },
        {
          data: () => ({
            body: 'Older',
            createdAt: { toDate: () => older },
            senderUid: 'alice',
          }),
          id: 'older',
          metadata: { hasPendingWrites: false },
        },
      ],
    });
    return jest.fn();
  });
  const listener = jest.fn();
  const repository = new FirebaseChatRepository();
  const unsubscribe = repository.subscribeMessages(
    'conversation-1',
    'alice',
    listener,
    jest.fn(),
  );

  expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
  expect(limit).toHaveBeenCalledWith(100);
  expect(
    listener.mock.calls[0][0].map((message: { id: string }) => message.id),
  ).toEqual(['older', 'newer']);
  unsubscribe();
});

test('clears every message batch while preserving the conversation', async () => {
  const mockDelete = jest.fn();
  const mockCommit = jest.fn().mockResolvedValue(undefined);
  const mockGetDocs = getDocs as jest.Mock;

  mockGetDocs
    .mockResolvedValueOnce({
      docs: [{ ref: { id: 'message-1' } }, { ref: { id: 'message-2' } }],
      empty: false,
    })
    .mockResolvedValueOnce({ docs: [], empty: true });
  (writeBatch as jest.Mock).mockReturnValue({
    commit: mockCommit,
    delete: mockDelete,
  });

  const repository = new FirebaseChatRepository();
  await repository.clearMessages('conversation-1');

  expect(mockDelete).toHaveBeenCalledTimes(2);
  expect(mockCommit).toHaveBeenCalledTimes(1);
  expect(mockGetDocs).toHaveBeenCalledTimes(2);
});
