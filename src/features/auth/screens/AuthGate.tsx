import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';

import {colors} from '../../../theme/colors';
import {ProfileGate} from '../../profile/screens/ProfileGate';
import {useAuthSession} from '../hooks/useAuthSession';
import {AuthScreen} from './AuthScreen';

export function AuthGate() {
  const auth = useAuthSession();

  if (auth.initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  if (!auth.user) {
    return <AuthScreen onCreateAccount={auth.createAccount} onSignIn={auth.signIn} />;
  }

  return <ProfileGate onDeleteAccount={auth.deleteAccount} onSignOut={auth.endSession} user={auth.user} />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    flex: 1,
    justifyContent: 'center',
  },
});
