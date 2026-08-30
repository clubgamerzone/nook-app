/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-qrcode-svg', () => 'QRCode');

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  AndroidImportance: {HIGH: 4},
  RepeatFrequency: {DAILY: 1, WEEKLY: 2},
  TriggerType: {TIMESTAMP: 0},
  default: {
    cancelNotification: jest.fn(),
    createChannel: jest.fn(),
    createTriggerNotification: jest.fn(),
    requestPermission: jest.fn(),
  },
}));

jest.mock('react-native-keychain', () => ({
  ACCESS_CONTROL: {BIOMETRY_CURRENT_SET: 'biometry'},
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'unlocked'},
  getGenericPassword: jest.fn(),
  getSupportedBiometryType: jest.fn().mockResolvedValue(null),
  resetGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
}));

jest.mock('@noble/hashes/scrypt.js', () => ({scryptAsync: jest.fn()}));
jest.mock('@noble/hashes/utils.js', () => ({
  bytesToHex: jest.fn(() => '00'),
  randomBytes: jest.fn(() => new Uint8Array([0])),
  utf8ToBytes: jest.fn(() => new Uint8Array([0])),
}));
jest.mock('react-native-get-random-values', () => ({}));

jest.mock('@react-native-firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  deleteUser: jest.fn(),
  EmailAuthProvider: {credential: jest.fn()},
  getAuth: jest.fn(() => ({currentUser: null})),
  onAuthStateChanged: jest.fn((_auth, listener) => {
    listener(null);
    return jest.fn();
  }),
  reauthenticateWithCredential: jest.fn(),
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
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(() => ({})),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  writeBatch: jest.fn(),
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
