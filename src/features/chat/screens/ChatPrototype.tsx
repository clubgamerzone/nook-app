import React, {useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors} from '../../../theme/colors';
import {useContacts} from '../../contacts/hooks/useContacts';
import {InvitationScreen} from '../../contacts/screens/InvitationScreen';
import type {UserProfile} from '../../profile/domain/models';
import type {Conversation} from '../domain/models';
import {useChatPrototype} from '../hooks/useChatPrototype';
import {ConversationListScreen} from './ConversationListScreen';
import {ConversationScreen} from './ConversationScreen';

type Props = {
  accountEmail: string | null;
  onSignOut: () => Promise<void>;
  profile: UserProfile;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.slice(0, 1).toUpperCase())
    .join('');
}

export function ChatPrototype({accountEmail, onSignOut, profile}: Props) {
  const insets = useSafeAreaInsets();
  const contacts = useContacts(profile.uid);
  const [showInvitations, setShowInvitations] = useState(false);
  const conversations = useMemo<Conversation[]>(
    () =>
      contacts.contacts.map(contact => ({
        contactInitials: initials(contact.displayName),
        contactName: contact.displayName,
        id: contact.conversationId,
        lastMessage: 'Private connection ready',
        lastMessageAt: contact.acceptedAt,
        unreadCount: 0,
        verified: false,
      })),
    [contacts.contacts],
  );
  const chat = useChatPrototype(conversations, profile.uid);

  if (contacts.loading) {
    return (
      <View style={[styles.loading, {paddingTop: insets.top}]}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  if (showInvitations) {
    return <InvitationScreen onBack={() => setShowInvitations(false)} profile={profile} />;
  }

  if (chat.activeConversation) {
    return (
      <ConversationScreen
        conversation={chat.activeConversation}
        error={chat.messageError}
        messages={chat.messages}
        onBack={chat.closeConversation}
        onChangeRetention={chat.changeRetention}
        onSend={chat.sendMessage}
        retentionSeconds={chat.retentionSeconds}
      />
    );
  }

  return (
    <ConversationListScreen
      accountEmail={accountEmail}
      accountDisplayName={profile.displayName}
      conversations={chat.conversations}
      contactError={contacts.error}
      onOpenConversation={chat.openConversation}
      onSignOut={onSignOut}
      onAddPerson={() => setShowInvitations(true)}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.canvas,
    flex: 1,
    justifyContent: 'center',
  },
});
