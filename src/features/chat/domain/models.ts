export type MessageDelivery = 'sending' | 'sent' | 'delivered' | 'failed';

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: 'me' | 'contact';
  body: string;
  createdAt: string;
  delivery: MessageDelivery;
};

export type Conversation = {
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
