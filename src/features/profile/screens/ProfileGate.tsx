import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

import type {AuthUser} from '../../auth/domain/AuthService';
import {ChatPrototype} from '../../chat/screens/ChatPrototype';
import {colors} from '../../../theme/colors';
import {useUserProfile} from '../hooks/useUserProfile';
import {CreateProfileScreen} from './CreateProfileScreen';

type Props = {
  onSignOut: () => Promise<void>;
  user: AuthUser;
};

export function ProfileGate({onSignOut, user}: Props) {
  const profile = useUserProfile(user.uid);

  if (profile.loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  if (!profile.profile) {
    return (
      <CreateProfileScreen
        accountEmail={user.email}
        initialError={profile.error}
        onCreate={profile.createProfile}
        onSignOut={onSignOut}
      />
    );
  }

  if (profile.error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>{profile.error}</Text>
      </View>
    );
  }

  return (
    <ChatPrototype
      accountEmail={user.email}
      onSignOut={onSignOut}
      profile={profile.profile}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.canvas,
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  error: {color: colors.text, fontSize: 14, lineHeight: 21, textAlign: 'center'},
});
