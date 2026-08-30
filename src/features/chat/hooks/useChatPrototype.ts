import {useCallback, useEffect, useMemo, useState} from 'react';

import {FirebaseChatRepository} from '../data/FirebaseChatRepository';
import type {ChatMessage, Conversation} from '../domain/models';

export function useChatPrototype(conversations: Conversation[], currentUid: string) {
  const repository = useMemo(() => new FirebaseChatRepository(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation>();
  const [messageError, setMessageError] = useState<string>();

  useEffect(() => {
    if (!activeConversation) {
      return;
    }

    setMessageError(undefined);
    return repository.subscribeMessages(activeConversation.id, currentUid, setMessages, () =>
      setMessageError('Messages could not be synchronized. Check your connection.'),
    );
  }, [activeConversation, currentUid, repository]);

  const openConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
  }, []);

  const closeConversation = useCallback(() => {
    setActiveConversation(undefined);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!activeConversation || !body.trim()) {
        return;
      }

      setMessageError(undefined);
      try {
        await repository.sendText(activeConversation.id, currentUid, body);
      } catch {
        setMessageError('Message not sent. Check your connection and try again.');
        throw new Error('message-send-failed');
      }
    },
    [activeConversation, currentUid, repository],
  );

  return {
    activeConversation,
    closeConversation,
    conversations,
    messageError,
    messages,
    openConversation,
    sendMessage,
  };
}
