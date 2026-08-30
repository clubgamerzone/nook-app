import type {ChatMessage, Conversation} from '../domain/models';

export interface ChatRepository {
  listConversations(): Promise<Conversation[]>;
  listMessages(conversationId: string): Promise<ChatMessage[]>;
  sendText(conversationId: string, body: string): Promise<ChatMessage>;
}
