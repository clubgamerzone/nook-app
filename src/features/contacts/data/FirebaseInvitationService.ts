import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';

import type { UserProfile } from '../../profile/domain/models';
import type { CreatedInvitation, InvitationPreview } from '../domain/models';

const INVITATION_LIFETIME_MS = 24 * 60 * 60 * 1000;

type InvitationData = {
  acceptedBy?: string;
  expiresAt?: Timestamp;
  inviterDisplayName?: string;
  inviterUid?: string;
  status?: string;
};

function invitationFromSnapshot(
  code: string,
  data: InvitationData | undefined,
) {
  if (
    !data ||
    data.status !== 'pending' ||
    typeof data.inviterUid !== 'string' ||
    typeof data.inviterDisplayName !== 'string' ||
    !(data.expiresAt instanceof Timestamp)
  ) {
    throw new Error('invite/not-available');
  }

  const expiresAt = data.expiresAt.toDate();
  if (expiresAt.getTime() <= Date.now()) {
    throw new Error('invite/expired');
  }

  return {
    code,
    expiresAt,
    inviterDisplayName: data.inviterDisplayName,
    inviterUid: data.inviterUid,
  };
}

export class FirebaseInvitationService {
  async create(profile: UserProfile): Promise<CreatedInvitation> {
    const database = getFirestore();
    const invitationRef = doc(collection(database, 'invitations'));
    const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS);

    await setDoc(invitationRef, {
      inviterDisplayName: profile.displayName,
      inviterUid: profile.uid,
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    return { code: invitationRef.id, expiresAt };
  }

  async preview(code: string, currentUid: string): Promise<InvitationPreview> {
    const normalizedCode = code.trim();
    const snapshot = await getDoc(
      doc(getFirestore(), 'invitations', normalizedCode),
    );
    if (!snapshot.exists()) {
      throw new Error('invite/not-found');
    }

    const invitation = invitationFromSnapshot(
      normalizedCode,
      snapshot.data() as InvitationData,
    );
    if (invitation.inviterUid === currentUid) {
      throw new Error('invite/own-code');
    }
    return invitation;
  }

  async accept(
    invitation: InvitationPreview,
    profile: UserProfile,
  ): Promise<string> {
    const database = getFirestore();
    const invitationRef = doc(database, 'invitations', invitation.code);
    const conversationRef = doc(database, 'conversations', invitation.code);
    const inviterContactRef = doc(
      database,
      'users',
      invitation.inviterUid,
      'contacts',
      profile.uid,
    );
    const recipientContactRef = doc(
      database,
      'users',
      profile.uid,
      'contacts',
      invitation.inviterUid,
    );

    await runTransaction(database, async transaction => {
      const snapshot = await transaction.get(invitationRef);
      if (!snapshot.exists()) {
        throw new Error('invite/not-found');
      }

      const currentInvitation = invitationFromSnapshot(
        invitation.code,
        snapshot.data() as InvitationData,
      );
      if (
        currentInvitation.inviterUid !== invitation.inviterUid ||
        currentInvitation.inviterUid === profile.uid
      ) {
        throw new Error('invite/not-available');
      }

      transaction.update(invitationRef, {
        acceptedAt: serverTimestamp(),
        acceptedBy: profile.uid,
        status: 'accepted',
      });
      transaction.set(conversationRef, {
        createdAt: serverTimestamp(),
        invitationId: invitation.code,
        messageRetentionSeconds: 604800,
        participantIds: [invitation.inviterUid, profile.uid],
      });
      transaction.set(inviterContactRef, {
        acceptedAt: serverTimestamp(),
        contactUid: profile.uid,
        conversationId: invitation.code,
        displayName: profile.displayName,
        invitationId: invitation.code,
        ownerUid: invitation.inviterUid,
      });
      transaction.set(recipientContactRef, {
        acceptedAt: serverTimestamp(),
        contactUid: invitation.inviterUid,
        conversationId: invitation.code,
        displayName: currentInvitation.inviterDisplayName,
        invitationId: invitation.code,
        ownerUid: profile.uid,
      });
    });

    return invitation.code;
  }

  async reject(invitation: InvitationPreview, currentUid: string) {
    const invitationRef = doc(getFirestore(), 'invitations', invitation.code);
    await runTransaction(getFirestore(), async transaction => {
      const snapshot = await transaction.get(invitationRef);
      if (!snapshot.exists()) {
        throw new Error('invite/not-found');
      }
      invitationFromSnapshot(
        invitation.code,
        snapshot.data() as InvitationData,
      );
      transaction.update(invitationRef, {
        acceptedBy: currentUid,
        respondedAt: serverTimestamp(),
        status: 'rejected',
      });
    });
  }
}
