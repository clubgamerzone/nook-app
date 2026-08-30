const mockValues = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockValues.get(key) ?? null)),
  removeItem: jest.fn((key: string) => {
    mockValues.delete(key);
    return Promise.resolve();
  }),
  setItem: jest.fn((key: string, value: string) => {
    mockValues.set(key, value);
    return Promise.resolve();
  }),
}));

import {OrganizerRepository} from '../src/features/organizer/data/OrganizerRepository';

beforeEach(() => mockValues.clear());

test('creates, updates, and removes a device-local organizer item', async () => {
  const repository = new OrganizerRepository();
  const item = await repository.create('user-1', {
    active: true,
    details: 'Bring the documents',
    repeat: 'none',
    scheduledAt: '2026-09-01T14:00:00.000Z',
    title: 'Appointment',
    type: 'appointment',
  });

  expect(await repository.list('user-1')).toEqual([item]);

  await repository.update('user-1', {...item, completed: true});
  expect((await repository.list('user-1'))[0].completed).toBe(true);

  await repository.remove('user-1', item.id);
  expect(await repository.list('user-1')).toEqual([]);
});
