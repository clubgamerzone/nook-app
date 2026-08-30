import { useCallback, useEffect, useMemo, useState } from 'react';

import { FirebaseChatRepository } from '../data/FirebaseChatRepository';
import {
  DEFAULT_MESSAGE_RETENTION_SECONDS,
  type ChatMessage,
  type Conversation,
  type MessageRetentionSeconds,
} from '../domain/models';

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map(message => [message.id, message]));
  incoming.forEach(message => byId.set(message.id, message));
  return [...byId.values()].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
}

export function useChatPrototype(
  conversations: Conversation[],
  currentUid: string,
) {
  const repository = useMemo(() => new FirebaseChatRepository(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation>();
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [messageError, setMessageError] = useState<string>();
  const [retentionSeconds, setRetentionSeconds] =
    useState<MessageRetentionSeconds>(DEFAULT_MESSAGE_RETENTION_SECONDS);

  useEffect(() => {
    if (!activeConversation) {
      return;
    }

    setMessageError(undefined);
    const unsubscribeMessages = repository.subscribeMessages(
      activeConversation.id,
      currentUid,
      (latestMessages, hasMore) => {
        setMessages(current => mergeMessages(current, latestMessages));
        setHasOlderMessages(hasMore);
      },
      () =>
        setMessageError(
          'Messages could not be synchronized. Check your connection.',
        ),
    );
    const unsubscribeConversationState = repository.subscribeConversationState(
      activeConversation.id,
      state => {
        setMessageCount(state.messageCount);
        setRetentionSeconds(state.retentionSeconds);
      },
      () =>
        setMessageError('The conversation settings could not be synchronized.'),
    );

    return () => {
      unsubscribeMessages();
      unsubscribeConversationState();
    };
  }, [activeConversation, currentUid, repository]);

  const openConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation);
    setHasOlderMessages(false);
    setMessageCount(0);
    setMessages([]);
  }, []);

  const closeConversation = useCallback(() => {
    setActiveConversation(undefined);
    setHasOlderMessages(false);
    setMessageCount(0);
    setMessages([]);
    setRetentionSeconds(DEFAULT_MESSAGE_RETENTION_SECONDS);
  }, []);

  const loadOlderMessages = useCallback(async () => {
    const oldestMessage = messages[0];
    if (!activeConversation || !oldestMessage || loadingOlderMessages) {
      return;
    }
    setLoadingOlderMessages(true);
    setMessageError(undefined);
    try {
      const page = await repository.loadOlderMessages(
        activeConversation.id,
        currentUid,
        oldestMessage.createdAt,
      );
      setMessages(current => mergeMessages(page.messages, current));
      setHasOlderMessages(page.hasMore);
    } catch {
      setMessageError(
        'Earlier messages could not be loaded. Check your connection.',
      );
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [
    activeConversation,
    currentUid,
    loadingOlderMessages,
    messages,
    repository,
  ]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!activeConversation || !body.trim()) {
        return;
      }

      setMessageError(undefined);
      try {
        await repository.sendText(activeConversation.id, currentUid, body);
      } catch {
        setMessageError(
          'Message not sent. Check your connection and try again.',
        );
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
        await repository.updateRetention(
          activeConversation.id,
          currentUid,
          seconds,
        );
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
      setMessages([]);
      setMessageCount(0);
    } catch {
      setMessageError(
        'The chat could not be cleared. Check your connection and try again.',
      );
      throw new Error('chat-clear-failed');
    }
  }, [activeConversation, repository]);

  return {
    activeConversation,
    changeRetention,
    clearChat,
    closeConversation,
    conversations,
    hasOlderMessages,
    loadOlderMessages,
    loadingOlderMessages,
    messageError,
    messageCount,
    messages,
    openConversation,
    retentionSeconds,
    sendMessage,
  };
}
