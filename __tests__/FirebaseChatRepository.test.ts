jest.mock('@react-native-firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(() => ({id: 'messages'})),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(() => ({id: 'database'})),
  limit: jest.fn(value => ({value})),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(value => value),
  serverTimestamp: jest.fn(),
  Timestamp: {fromMillis: jest.fn()},
  updateDoc: jest.fn(),
  writeBatch: jest.fn(),
}));

import {getDocs, writeBatch} from '@react-native-firebase/firestore';

import {FirebaseChatRepository} from '../src/features/chat/data/FirebaseChatRepository';

test('clears every message batch while preserving the conversation', async () => {
  const mockDelete = jest.fn();
  const mockCommit = jest.fn().mockResolvedValue(undefined);
  const mockGetDocs = getDocs as jest.Mock;

  mockGetDocs
    .mockResolvedValueOnce({
      docs: [{ref: {id: 'message-1'}}, {ref: {id: 'message-2'}}],
      empty: false,
    })
    .mockResolvedValueOnce({docs: [], empty: true});
  (writeBatch as jest.Mock).mockReturnValue({commit: mockCommit, delete: mockDelete});

  const repository = new FirebaseChatRepository();
  await repository.clearMessages('conversation-1');

  expect(mockDelete).toHaveBeenCalledTimes(2);
  expect(mockCommit).toHaveBeenCalledTimes(1);
  expect(mockGetDocs).toHaveBeenCalledTimes(2);
});
