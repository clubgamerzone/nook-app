import type {ChatRepository} from './ChatRepository';
import type {ChatMessage, Conversation} from '../domain/models';

const conversationId = 'conversation-demo-alex';

const seededMessages: ChatMessage[] = [
  {
    id: 'message-1',
    conversationId,
    sender: 'contact',
    body: 'Your private conversation starts here.',
    createdAt: '2026-08-29T20:10:00.000Z',
    delivery: 'delivered',
  },
  {
    id: 'message-2',
    conversationId,
    sender: 'me',
    body: 'Perfect. I can see it now.',
    createdAt: '2026-08-29T20:11:00.000Z',
    delivery: 'delivered',
  },
];

/** Development-only repository. It deliberately makes no security claims. */
export class InMemoryChatRepository implements ChatRepository {
  private messages = [...seededMessages];

  async listConversations(): Promise<Conversation[]> {
    const last = this.messages[this.messages.length - 1];

    return [
      {
        blocked: false,
        contactUid: 'alex-morgan',
        id: conversationId,
        contactName: 'Alex Morgan',
        contactInitials: 'AM',
        lastMessage: last?.body ?? 'No messages yet',
        lastMessageAt: last?.createdAt ?? new Date().toISOString(),
        unreadCount: 0,
        verified: true,
      },
    ];
  }

  async listMessages(id: string): Promise<ChatMessage[]> {
    return this.messages.filter(message => message.conversationId === id);
  }

  async sendText(id: string, body: string): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: `message-${Date.now()}`,
      conversationId: id,
      sender: 'me',
      body: body.trim(),
      createdAt: new Date().toISOString(),
      delivery: 'sent',
    };

    this.messages = [...this.messages, message];
    return message;
  }
}
