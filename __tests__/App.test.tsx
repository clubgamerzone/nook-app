/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

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

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
