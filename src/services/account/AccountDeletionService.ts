import {EmailAuthProvider, deleteUser, getAuth, reauthenticateWithCredential} from '@react-native-firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  limit,
  query,
  writeBatch,
} from '@react-native-firebase/firestore';

import {OrganizerRepository} from '../../features/organizer/data/OrganizerRepository';
import {PrivateLockService} from '../../features/privateSpace/lock/PrivateLockService';

const DELETE_BATCH_SIZE = 200;

export class AccountDeletionService {
  async delete(password: string) {
    const user = getAuth().currentUser;
    if (!user?.email) {
      throw new Error('account/no-email-user');
    }
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));

    const database = getFirestore();
    const contacts = collection(database, 'users', user.uid, 'contacts');
    while (true) {
      const snapshot = await getDocs(query(contacts, limit(DELETE_BATCH_SIZE)));
      if (snapshot.empty) {
        break;
      }
      const batch = writeBatch(database);
      snapshot.docs.forEach(contact => batch.delete(contact.ref));
      await batch.commit();
    }

    await deleteDoc(doc(database, 'users', user.uid));
    await new OrganizerRepository().clear(user.uid);
    await new PrivateLockService().reset(user.uid);
    await deleteUser(user);
  }
}
