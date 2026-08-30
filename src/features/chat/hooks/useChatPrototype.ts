import {useCallback, useMemo, useState} from 'react';

import {InMemoryChatRepository} from '../data/InMemoryChatRepository';
import type {ChatMessage, Conversation} from '../domain/models';

export function useChatPrototype(conversations: Conversation[]) {
  const repository = useMemo(() => new InMemoryChatRepository(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation>();

  const openConversation = useCallback(
    async (conversation: Conversation) => {
      setActiveConversation(conversation);
      setMessages(await repository.listMessages(conversation.id));
    },
    [repository],
  );

  const closeConversation = useCallback(() => {
    setActiveConversation(undefined);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!activeConversation || !body.trim()) {
        return;
      }

      const message = await repository.sendText(activeConversation.id, body);
      setMessages(current => [...current, message]);
    },
    [activeConversation, repository],
  );

  return {
    activeConversation,
    closeConversation,
    conversations,
    messages,
    openConversation,
    sendMessage,
  };
}
