import {useCallback, useEffect, useMemo, useState} from 'react';

import {InMemoryChatRepository} from '../data/InMemoryChatRepository';
import type {ChatMessage, Conversation} from '../domain/models';

export function useChatPrototype() {
  const repository = useMemo(() => new InMemoryChatRepository(), []);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation>();
  const [loading, setLoading] = useState(true);

  const refreshConversations = useCallback(async () => {
    setConversations(await repository.listConversations());
  }, [repository]);

  useEffect(() => {
    refreshConversations().finally(() => setLoading(false));
  }, [refreshConversations]);

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
    refreshConversations();
  }, [refreshConversations]);

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
    loading,
    messages,
    openConversation,
    sendMessage,
  };
}
