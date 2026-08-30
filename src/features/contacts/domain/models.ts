export type Contact = {
  acceptedAt: string;
  blocked: boolean;
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
