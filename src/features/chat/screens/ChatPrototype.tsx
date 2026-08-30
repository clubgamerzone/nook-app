import React from 'react';
import {ActivityIndicator, Alert, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors} from '../../../theme/colors';
import {useChatPrototype} from '../hooks/useChatPrototype';
import {ConversationListScreen} from './ConversationListScreen';
import {ConversationScreen} from './ConversationScreen';

export function ChatPrototype() {
  const insets = useSafeAreaInsets();
  const chat = useChatPrototype();

  if (chat.loading) {
    return (
      <View style={[styles.loading, {paddingTop: insets.top}]}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  if (chat.activeConversation) {
    return (
      <ConversationScreen
        conversation={chat.activeConversation}
        messages={chat.messages}
        onBack={chat.closeConversation}
        onSend={chat.sendMessage}
      />
    );
  }

  return (
    <ConversationListScreen
      conversations={chat.conversations}
      onOpenConversation={chat.openConversation}
      onAddPerson={() =>
        Alert.alert(
          'Invitations come next',
          'The next milestone connects one-time invitation links to account identity keys.',
        )
      }
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
