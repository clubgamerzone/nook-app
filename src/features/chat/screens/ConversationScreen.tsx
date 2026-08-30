import React, { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../../theme/colors';
import {
  MAX_CONVERSATION_MESSAGES,
  MESSAGE_LIMIT_WARNING_THRESHOLD,
  type ChatMessage,
  type Conversation,
  type MessageRetentionSeconds,
} from '../domain/models';

const RETENTION_OPTIONS: Array<{
  label: string;
  value: MessageRetentionSeconds;
}> = [
  { label: '24 hours', value: 86400 },
  { label: '3 days', value: 259200 },
  { label: '7 days', value: 604800 },
  { label: '30 days', value: 2592000 },
];

function retentionLabel(value: MessageRetentionSeconds) {
  return (
    RETENTION_OPTIONS.find(option => option.value === value)?.label ?? '7 days'
  );
}

type Props = {
  conversation: Conversation;
  error?: string;
  hasOlderMessages: boolean;
  loadingOlderMessages: boolean;
  messageCount: number;
  messages: ChatMessage[];
  onBack: () => void;
  onBlock: () => Promise<void>;
  onChangeRetention: (seconds: MessageRetentionSeconds) => Promise<void>;
  onClearChat: () => Promise<void>;
  onLoadOlderMessages: () => Promise<void>;
  onRemove: () => Promise<void>;
  onReport: (reason: string) => Promise<void>;
  onSend: (body: string) => Promise<void>;
  retentionSeconds: MessageRetentionSeconds;
};

function formatMessageTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function ConversationScreen({
  conversation,
  error,
  hasOlderMessages,
  loadingOlderMessages,
  messageCount,
  messages,
  onBack,
  onBlock,
  onChangeRetention,
  onClearChat,
  onLoadOlderMessages,
  onRemove,
  onReport,
  onSend,
  retentionSeconds,
}: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const shouldScrollToEnd = useRef(true);
  const [draft, setDraft] = useState('');
  const [showRetention, setShowRetention] = useState(false);
  const [changingRetention, setChangingRetention] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [safetyBusy, setSafetyBusy] = useState(false);
  const storageNotice =
    messageCount >= MESSAGE_LIMIT_WARNING_THRESHOLD
      ? messageCount >= MAX_CONVERSATION_MESSAGES
        ? `This chat has reached its ${MAX_CONVERSATION_MESSAGES.toLocaleString()}-message limit. New messages replace the oldest stored messages.`
        : `This chat is nearing its ${MAX_CONVERSATION_MESSAGES.toLocaleString()}-message limit. ${(
            MAX_CONVERSATION_MESSAGES - messageCount
          ).toLocaleString()} message${
            MAX_CONVERSATION_MESSAGES - messageCount === 1 ? '' : 's'
          } remaining.`
      : undefined;

  const chooseRetention = async (seconds: MessageRetentionSeconds) => {
    setChangingRetention(true);
    try {
      await onChangeRetention(seconds);
      setShowRetention(false);
    } catch {
      setShowRetention(false);
    } finally {
      setChangingRetention(false);
    }
  };

  const clearChat = async () => {
    setClearingChat(true);
    try {
      await onClearChat();
    } catch {
      // The synchronized error banner explains the failure.
    } finally {
      setClearingChat(false);
    }
  };

  const confirmClearChat = () => {
    setShowRetention(false);
    Alert.alert(
      'Clear the entire chat?',
      'Every message will be permanently removed for both people. Your connection will remain.',
      [
        { style: 'cancel', text: 'Cancel' },
        { onPress: clearChat, style: 'destructive', text: 'Clear chat' },
      ],
    );
  };

  const runSafetyAction = async (action: () => Promise<void>) => {
    setSafetyBusy(true);
    try {
      await action();
    } finally {
      setSafetyBusy(false);
    }
  };

  const confirmBlock = () => {
    setShowRetention(false);
    Alert.alert(
      conversation.blocked
        ? `Unblock ${conversation.contactName}?`
        : `Block ${conversation.contactName}?`,
      conversation.blocked
        ? 'They will be able to send messages again.'
        : 'They will no longer be able to send messages to you. You can unblock them later.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: () => runSafetyAction(onBlock),
          style: conversation.blocked ? 'default' : 'destructive',
          text: conversation.blocked ? 'Unblock' : 'Block',
        },
      ],
    );
  };

  const confirmRemove = () => {
    setShowRetention(false);
    Alert.alert(
      'Remove this connection?',
      'The conversation disappears from your list and neither person can send new messages through this connection.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: () => runSafetyAction(onRemove),
          style: 'destructive',
          text: 'Remove',
        },
      ],
    );
  };

  const chooseReportReason = () => {
    setShowRetention(false);
    Alert.alert(
      'Report this contact',
      'Choose the reason. Nook sends account and conversation references, but not message text.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: () => runSafetyAction(() => onReport('spam')),
          text: 'Spam or scam',
        },
        {
          onPress: () => runSafetyAction(() => onReport('harassment')),
          text: 'Harassment',
        },
        {
          onPress: () => runSafetyAction(() => onReport('threats')),
          text: 'Threats or safety',
        },
      ],
    );
  };

  const submit = async () => {
    const body = draft.trim();
    if (!body) {
      return;
    }

    setDraft('');
    try {
      shouldScrollToEnd.current = true;
      await onSend(body);
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true }),
      );
    } catch {
      setDraft(body);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{conversation.contactInitials}</Text>
        </View>
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{conversation.contactName}</Text>
            {conversation.verified ? (
              <Text style={styles.verified}>✓</Text>
            ) : null}
          </View>
          <Text style={styles.status}>
            Disappearing messages: {retentionLabel(retentionSeconds)}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Conversation settings"
          accessibilityRole="button"
          onPress={() => setShowRetention(true)}
          style={styles.moreButton}
        >
          <Text style={styles.moreText}>•••</Text>
        </Pressable>
      </View>

      <View style={styles.encryptionNotice}>
        <Text style={styles.noticeText}>
          Encryption adapter not connected — development UI
        </Text>
      </View>
      {conversation.blocked ? (
        <View style={styles.blockedNotice}>
          <Text style={styles.blockedNoticeText}>
            You blocked this contact. New messages are disabled.
          </Text>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        contentContainerStyle={styles.messages}
        data={messages}
        keyExtractor={item => item.id}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          storageNotice ? (
            <View style={styles.storageNotice}>
              <Text style={styles.storageNoticeLabel}>NOOK STORAGE NOTICE</Text>
              <Text style={styles.storageNoticeText}>{storageNotice}</Text>
            </View>
          ) : undefined
        }
        ListHeaderComponent={
          hasOlderMessages ? (
            <Pressable
              disabled={loadingOlderMessages}
              onPress={onLoadOlderMessages}
              style={styles.loadOlderButton}
            >
              <Text style={styles.loadOlderText}>
                {loadingOlderMessages
                  ? 'Loading earlier messages…'
                  : 'Load earlier messages'}
              </Text>
            </Pressable>
          ) : undefined
        }
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        onContentSizeChange={() => {
          if (shouldScrollToEnd.current) {
            shouldScrollToEnd.current = false;
            listRef.current?.scrollToEnd({ animated: false });
          }
        }}
        renderItem={({ item }) => {
          const outgoing = item.sender === 'me';
          return (
            <View
              style={[styles.messageRow, outgoing && styles.messageRowOutgoing]}
            >
              <View
                style={[
                  styles.bubble,
                  outgoing ? styles.outgoing : styles.incoming,
                ]}
              >
                <Text
                  style={[styles.messageText, outgoing && styles.outgoingText]}
                >
                  {item.body}
                </Text>
                <View style={styles.messageMeta}>
                  <Text
                    style={[
                      styles.messageTime,
                      outgoing && styles.outgoingMeta,
                    ]}
                  >
                    {formatMessageTime(item.createdAt)}
                  </Text>
                  {outgoing ? (
                    <Text style={[styles.delivery, styles.outgoingMeta]}>
                      {item.delivery === 'delivered' ? '✓✓' : '✓'}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          );
        }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View
        style={[
          styles.composer,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TextInput
          accessibilityLabel="Message"
          editable={!conversation.blocked}
          multiline
          onChangeText={setDraft}
          placeholder={
            conversation.blocked ? 'Contact blocked' : 'Write a private message'
          }
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={draft}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={!draft.trim() || conversation.blocked}
          onPress={submit}
          style={({ pressed }) => [
            styles.sendButton,
            (!draft.trim() || conversation.blocked) && styles.sendDisabled,
            pressed && styles.sendPressed,
          ]}
        >
          <Text style={styles.sendText}>↑</Text>
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setShowRetention(false)}
        transparent
        visible={showRetention}
      >
        <Pressable
          onPress={() => setShowRetention(false)}
          style={styles.modalBackdrop}
        >
          <Pressable onPress={() => undefined} style={styles.retentionCard}>
            <Text style={styles.retentionTitle}>Disappearing messages</Text>
            <Text style={styles.retentionHelp}>
              This applies to new messages. Older messages keep their original
              lifetime.
            </Text>
            {RETENTION_OPTIONS.map(option => {
              const selected = option.value === retentionSeconds;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: selected,
                    disabled: changingRetention,
                  }}
                  disabled={changingRetention}
                  key={option.value}
                  onPress={() => chooseRetention(option.value)}
                  style={[
                    styles.retentionOption,
                    selected && styles.retentionOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.retentionOptionText,
                      selected && styles.retentionOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.retentionCheck}>
                    {selected ? '✓' : ''}
                  </Text>
                </Pressable>
              );
            })}
            <View style={styles.destructiveDivider} />
            <Pressable
              accessibilityRole="button"
              disabled={clearingChat}
              onPress={confirmClearChat}
              style={styles.clearChatButton}
            >
              <Text style={styles.clearChatText}>
                {clearingChat ? 'Clearing chat…' : 'Clear entire chat'}
              </Text>
            </Pressable>
            <Text style={styles.clearChatHelp}>
              Keeps this person connected, but deletes all messages for both
              people.
            </Text>
            <View style={styles.destructiveDivider} />
            <Pressable
              disabled={safetyBusy}
              onPress={confirmBlock}
              style={styles.safetyButton}
            >
              <Text style={styles.safetyText}>
                {conversation.blocked ? 'Unblock contact' : 'Block contact'}
              </Text>
            </Pressable>
            <Pressable
              disabled={safetyBusy}
              onPress={chooseReportReason}
              style={styles.safetyButton}
            >
              <Text style={styles.safetyText}>Report contact</Text>
            </Pressable>
            <Pressable
              disabled={safetyBusy}
              onPress={confirmRemove}
              style={styles.removeButton}
            >
              <Text style={styles.removeText}>Remove connection</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas, flex: 1 },
  header: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    flexDirection: 'row',
    paddingBottom: 13,
    paddingHorizontal: 14,
  },
  backButton: { alignItems: 'center', justifyContent: 'center', width: 36 },
  backText: { color: colors.surface, fontSize: 38, lineHeight: 40 },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.sageLight,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginLeft: 5,
    width: 40,
  },
  avatarText: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  identity: { flex: 1, marginLeft: 11 },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  name: { color: colors.surface, fontSize: 16, fontWeight: '700' },
  verified: { color: '#A9CEB7', fontSize: 12 },
  status: { color: '#AFC0B8', fontSize: 12, marginTop: 2 },
  moreButton: { padding: 8 },
  moreText: { color: colors.surface, fontSize: 13, letterSpacing: 2 },
  encryptionNotice: {
    alignItems: 'center',
    backgroundColor: '#F2E7D8',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noticeText: { color: colors.warning, fontSize: 11, fontWeight: '700' },
  blockedNotice: {
    backgroundColor: '#F7E8E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  blockedNoticeText: {
    color: '#923E38',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  messages: { flexGrow: 1, paddingHorizontal: 14, paddingVertical: 20 },
  loadOlderButton: {
    alignItems: 'center',
    marginBottom: 18,
    paddingVertical: 8,
  },
  loadOlderText: { color: colors.inkSoft, fontSize: 12, fontWeight: '800' },
  storageNotice: {
    alignSelf: 'center',
    backgroundColor: '#F2E7D8',
    borderRadius: 14,
    marginTop: 10,
    maxWidth: '90%',
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  storageNoticeLabel: {
    color: colors.warning,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  storageNoticeText: {
    color: colors.warning,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
    textAlign: 'center',
  },
  error: {
    backgroundColor: '#FCE8E8',
    color: '#A94343',
    fontSize: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    textAlign: 'center',
  },
  messageRow: { alignItems: 'flex-start', marginBottom: 10 },
  messageRowOutgoing: { alignItems: 'flex-end' },
  bubble: {
    borderRadius: 18,
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  incoming: { backgroundColor: colors.incoming, borderBottomLeftRadius: 5 },
  outgoing: { backgroundColor: colors.outgoing, borderBottomRightRadius: 5 },
  messageText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  outgoingText: { color: colors.surface },
  messageMeta: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  messageTime: { color: colors.textMuted, fontSize: 10 },
  outgoingMeta: { color: '#B7C7BF' },
  delivery: { fontSize: 10 },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    color: colors.text,
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sendDisabled: { backgroundColor: '#B8C0BB' },
  sendPressed: { opacity: 0.75 },
  sendText: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 27,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(12, 25, 20, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  retentionCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 34,
    maxHeight: '94%',
  },
  retentionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  retentionHelp: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
    marginTop: 7,
  },
  retentionOption: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 8,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  retentionOptionSelected: {
    backgroundColor: colors.sageLight,
    borderColor: colors.sage,
  },
  retentionOptionText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  retentionOptionTextSelected: { color: colors.inkSoft, fontWeight: '800' },
  retentionCheck: { color: colors.inkSoft, fontSize: 16, fontWeight: '900' },
  destructiveDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 18,
  },
  clearChatButton: {
    alignItems: 'center',
    borderColor: '#B94747',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
  },
  clearChatText: { color: '#A94343', fontSize: 14, fontWeight: '800' },
  clearChatHelp: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
    textAlign: 'center',
  },
  safetyButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 12,
  },
  safetyText: { color: colors.inkSoft, fontSize: 13, fontWeight: '800' },
  removeButton: { alignItems: 'center', marginTop: 8, paddingVertical: 12 },
  removeText: { color: '#A94343', fontSize: 13, fontWeight: '800' },
});
