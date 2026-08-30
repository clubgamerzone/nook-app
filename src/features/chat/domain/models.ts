export type MessageDelivery = 'sending' | 'sent' | 'delivered' | 'failed';

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: 'me' | 'contact';
  body: string;
  createdAt: string;
  delivery: MessageDelivery;
  expiresAt?: string;
};

export type MessageRetentionSeconds = 86400 | 259200 | 604800 | 2592000;

export const DEFAULT_MESSAGE_RETENTION_SECONDS: MessageRetentionSeconds = 604800;
export const MESSAGE_PAGE_SIZE = 100;
export const MAX_CONVERSATION_MESSAGES = 2500;
export const MESSAGE_LIMIT_WARNING_THRESHOLD = 2250;

export type Conversation = {
  blocked: boolean;
  contactUid: string;
  id: string;
  contactName: string;
  contactInitials: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  verified: boolean;
};

export type CiphertextEnvelope = {
  version: number;
  ciphertext: string;
  nonce: string;
};
