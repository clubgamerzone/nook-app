/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-qrcode-svg', () => 'QRCode');

jest.mock('@react-native-firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn((_auth, listener) => {
    listener(null);
    return jest.fn();
  }),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  addDoc: jest.fn(),
  Timestamp: class MockTimestamp {
    static fromDate(value: Date) {
      return {toDate: () => value};
    }
  },
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getFirestore: jest.fn(() => ({})),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
