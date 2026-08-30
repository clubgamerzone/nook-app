import {useCallback, useEffect, useMemo, useState} from 'react';

import {FirebaseChatRepository} from '../data/FirebaseChatRepository';
import type {ChatMessage, Conversation, MessageRetentionSeconds} from '../domain/models';

export function useChatPrototype(conversations: Conversation[], currentUid: string) {
  const repository = useMemo(() => new FirebaseChatRepository(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation>();
  const [messageError, setMessageError] = useState<string>();
  const [retentionSeconds, setRetentionSeconds] = useState<MessageRetentionSeconds>(0);

  useEffect(() => {
    if (!activeConversation) {
      return;
    }

    setMessageError(undefined);
    const unsubscribeMessages = repository.subscribeMessages(activeConversation.id, currentUid, setMessages, () =>
      setMessageError('Messages could not be synchronized. Check your connection.'),
    );
    const unsubscribeRetention = repository.subscribeRetention(activeConversation.id, setRetentionSeconds, () =>
      setMessageError('The disappearing-message setting could not be synchronized.'),
    );

    return () => {
      unsubscribeMessages();
      unsubscribeRetention();
    };
  }, [activeConversation, currentUid, repository]);

  const openConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
  }, []);

  const closeConversation = useCallback(() => {
    setActiveConversation(undefined);
    setMessages([]);
    setRetentionSeconds(0);
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

  const changeRetention = useCallback(
    async (seconds: MessageRetentionSeconds) => {
      if (!activeConversation) {
        return;
      }
      setMessageError(undefined);
      try {
        await repository.updateRetention(activeConversation.id, currentUid, seconds);
      } catch {
        setMessageError('The disappearing-message setting was not changed.');
        throw new Error('retention-update-failed');
      }
    },
    [activeConversation, currentUid, repository],
  );

  const clearChat = useCallback(async () => {
    if (!activeConversation) {
      return;
    }
    setMessageError(undefined);
    try {
      await repository.clearMessages(activeConversation.id);
    } catch {
      setMessageError('The chat could not be cleared. Check your connection and try again.');
      throw new Error('chat-clear-failed');
    }
  }, [activeConversation, repository]);

  return {
    activeConversation,
    changeRetention,
    clearChat,
    closeConversation,
    conversations,
    messageError,
    messages,
    openConversation,
    retentionSeconds,
    sendMessage,
  };
}
