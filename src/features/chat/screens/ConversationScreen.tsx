import React, {useRef, useState} from 'react';
import {
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
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors} from '../../../theme/colors';
import type {ChatMessage, Conversation, MessageRetentionSeconds} from '../domain/models';

const RETENTION_OPTIONS: Array<{label: string; value: MessageRetentionSeconds}> = [
  {label: '24 hours', value: 86400},
  {label: '3 days', value: 259200},
  {label: '7 days', value: 604800},
  {label: '30 days', value: 2592000},
  {label: 'Never', value: 0},
];

function retentionLabel(value: MessageRetentionSeconds) {
  return RETENTION_OPTIONS.find(option => option.value === value)?.label ?? 'Never';
}

type Props = {
  conversation: Conversation;
  error?: string;
  messages: ChatMessage[];
  onBack: () => void;
  onChangeRetention: (seconds: MessageRetentionSeconds) => Promise<void>;
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
  messages,
  onBack,
  onChangeRetention,
  onSend,
  retentionSeconds,
}: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [draft, setDraft] = useState('');
  const [showRetention, setShowRetention] = useState(false);
  const [changingRetention, setChangingRetention] = useState(false);

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

  const submit = async () => {
    const body = draft.trim();
    if (!body) {
      return;
    }

    setDraft('');
    try {
      await onSend(body);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({animated: true}));
    } catch {
      setDraft(body);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <View style={[styles.header, {paddingTop: insets.top + 10}]}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{conversation.contactInitials}</Text>
        </View>
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{conversation.contactName}</Text>
            {conversation.verified ? <Text style={styles.verified}>✓</Text> : null}
          </View>
          <Text style={styles.status}>Disappearing messages: {retentionLabel(retentionSeconds)}</Text>
        </View>
        <Pressable
          accessibilityLabel="Conversation settings"
          accessibilityRole="button"
          onPress={() => setShowRetention(true)}
          style={styles.moreButton}>
          <Text style={styles.moreText}>•••</Text>
        </Pressable>
      </View>

      <View style={styles.encryptionNotice}>
        <Text style={styles.noticeText}>Encryption adapter not connected — development UI</Text>
      </View>

      <FlatList
        ref={listRef}
        contentContainerStyle={styles.messages}
        data={messages}
        keyExtractor={item => item.id}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({animated: false})}
        renderItem={({item}) => {
          const outgoing = item.sender === 'me';
          return (
            <View style={[styles.messageRow, outgoing && styles.messageRowOutgoing]}>
              <View style={[styles.bubble, outgoing ? styles.outgoing : styles.incoming]}>
                <Text style={[styles.messageText, outgoing && styles.outgoingText]}>{item.body}</Text>
                <View style={styles.messageMeta}>
                  <Text style={[styles.messageTime, outgoing && styles.outgoingMeta]}>
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

      <View style={[styles.composer, {paddingBottom: Math.max(insets.bottom, 12)}]}>
        <TextInput
          accessibilityLabel="Message"
          multiline
          onChangeText={setDraft}
          placeholder="Write a private message"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={draft}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={!draft.trim()}
          onPress={submit}
          style={({pressed}) => [
            styles.sendButton,
            !draft.trim() && styles.sendDisabled,
            pressed && styles.sendPressed,
          ]}>
          <Text style={styles.sendText}>↑</Text>
        </Pressable>
      </View>

      <Modal animationType="fade" onRequestClose={() => setShowRetention(false)} transparent visible={showRetention}>
        <Pressable onPress={() => setShowRetention(false)} style={styles.modalBackdrop}>
          <Pressable onPress={() => undefined} style={styles.retentionCard}>
            <Text style={styles.retentionTitle}>Disappearing messages</Text>
            <Text style={styles.retentionHelp}>
              This applies to new messages. Older messages keep their original lifetime.
            </Text>
            {RETENTION_OPTIONS.map(option => {
              const selected = option.value === retentionSeconds;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{checked: selected, disabled: changingRetention}}
                  disabled={changingRetention}
                  key={option.value}
                  onPress={() => chooseRetention(option.value)}
                  style={[styles.retentionOption, selected && styles.retentionOptionSelected]}>
                  <Text style={[styles.retentionOptionText, selected && styles.retentionOptionTextSelected]}>
                    {option.label}
                  </Text>
                  <Text style={styles.retentionCheck}>{selected ? '✓' : ''}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {backgroundColor: colors.canvas, flex: 1},
  header: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    flexDirection: 'row',
    paddingBottom: 13,
    paddingHorizontal: 14,
  },
  backButton: {alignItems: 'center', justifyContent: 'center', width: 36},
  backText: {color: colors.surface, fontSize: 38, lineHeight: 40},
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.sageLight,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginLeft: 5,
    width: 40,
  },
  avatarText: {color: colors.ink, fontSize: 13, fontWeight: '800'},
  identity: {flex: 1, marginLeft: 11},
  nameRow: {alignItems: 'center', flexDirection: 'row', gap: 6},
  name: {color: colors.surface, fontSize: 16, fontWeight: '700'},
  verified: {color: '#A9CEB7', fontSize: 12},
  status: {color: '#AFC0B8', fontSize: 12, marginTop: 2},
  moreButton: {padding: 8},
  moreText: {color: colors.surface, fontSize: 13, letterSpacing: 2},
  encryptionNotice: {
    alignItems: 'center',
    backgroundColor: '#F2E7D8',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noticeText: {color: colors.warning, fontSize: 11, fontWeight: '700'},
  messages: {flexGrow: 1, paddingHorizontal: 14, paddingVertical: 20},
  error: {
    backgroundColor: '#FCE8E8',
    color: '#A94343',
    fontSize: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    textAlign: 'center',
  },
  messageRow: {alignItems: 'flex-start', marginBottom: 10},
  messageRowOutgoing: {alignItems: 'flex-end'},
  bubble: {
    borderRadius: 18,
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  incoming: {backgroundColor: colors.incoming, borderBottomLeftRadius: 5},
  outgoing: {backgroundColor: colors.outgoing, borderBottomRightRadius: 5},
  messageText: {color: colors.text, fontSize: 15, lineHeight: 21},
  outgoingText: {color: colors.surface},
  messageMeta: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {color: colors.textMuted, fontSize: 10},
  outgoingMeta: {color: '#B7C7BF'},
  delivery: {fontSize: 10},
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
  sendDisabled: {backgroundColor: '#B8C0BB'},
  sendPressed: {opacity: 0.75},
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
  },
  retentionTitle: {color: colors.text, fontSize: 20, fontWeight: '800'},
  retentionHelp: {color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 14, marginTop: 7},
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
  retentionOptionSelected: {backgroundColor: colors.sageLight, borderColor: colors.sage},
  retentionOptionText: {color: colors.text, flex: 1, fontSize: 15, fontWeight: '600'},
  retentionOptionTextSelected: {color: colors.inkSoft, fontWeight: '800'},
  retentionCheck: {color: colors.inkSoft, fontSize: 16, fontWeight: '900'},
});
