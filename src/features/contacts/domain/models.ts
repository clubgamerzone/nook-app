export type Contact = {
  acceptedAt: string;
  contactUid: string;
  conversationId: string;
  displayName: string;
};

export type CreatedInvitation = {
  code: string;
  expiresAt: Date;
};

export type InvitationPreview = {
  code: string;
  expiresAt: Date;
  inviterDisplayName: string;
  inviterUid: string;
};
