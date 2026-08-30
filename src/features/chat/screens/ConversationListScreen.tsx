import React from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors} from '../../../theme/colors';
import {PrivacyBadge} from '../components/PrivacyBadge';
import type {Conversation} from '../domain/models';

type Props = {
  conversations: Conversation[];
  onAddPerson: () => void;
  onOpenConversation: (conversation: Conversation) => void;
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function ConversationListScreen({
  conversations,
  onAddPerson,
  onOpenConversation,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, {paddingTop: insets.top + 22}]}>
        <View style={styles.headerRow}>
          <View style={styles.heading}>
            <PrivacyBadge />
            <Text style={styles.title}>Conversations</Text>
            <Text style={styles.subtitle}>The people you chose, and no one else.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a person"
            onPress={onAddPerson}
            style={({pressed}) => [styles.addButton, pressed && styles.pressed]}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenConversation(item)}
            style={({pressed}) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.contactInitials}</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.contactRow}>
                <View style={styles.nameRow}>
                  <Text style={styles.contactName}>{item.contactName}</Text>
                  {item.verified ? <Text style={styles.verified}>✓</Text> : null}
                </View>
                <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
              </View>
              <Text numberOfLines={1} style={styles.preview}>
                {item.lastMessage}
              </Text>
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={styles.footerNote}>
            <Text style={styles.footerTitle}>Messages stay separate</Text>
            <Text style={styles.footerText}>
              Nook will lock this area whenever the app leaves the foreground.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {backgroundColor: colors.canvas, flex: 1},
  header: {
    backgroundColor: colors.ink,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 28,
    paddingHorizontal: 22,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heading: {flex: 1},
  title: {color: colors.surface, fontSize: 31, fontWeight: '800', marginTop: 22},
  subtitle: {color: '#B9C8C0', fontSize: 14, marginTop: 7},
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginLeft: 14,
    width: 40,
  },
  addButtonText: {color: colors.ink, fontSize: 26, lineHeight: 28},
  list: {padding: 18, paddingBottom: 36},
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 15,
  },
  pressed: {opacity: 0.72},
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.sageLight,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: {color: colors.inkSoft, fontSize: 15, fontWeight: '800'},
  cardBody: {flex: 1, marginLeft: 13},
  contactRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameRow: {alignItems: 'center', flexDirection: 'row', gap: 6},
  contactName: {color: colors.text, fontSize: 17, fontWeight: '700'},
  verified: {color: colors.sage, fontSize: 13, fontWeight: '800'},
  time: {color: colors.textMuted, fontSize: 12},
  preview: {color: colors.textMuted, fontSize: 14, marginTop: 5},
  footerNote: {
    borderColor: colors.border,
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: 18,
    padding: 16,
  },
  footerTitle: {color: colors.text, fontSize: 14, fontWeight: '700'},
  footerText: {color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 4},
});
