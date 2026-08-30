import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors} from '../../../theme/colors';

type Props = {
  onCreateAccount: (email: string, password: string) => Promise<void>;
  onSignIn: (email: string, password: string) => Promise<void>;
};

function readableAuthError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('operation-not-allowed')) {
      return 'Email/password sign-in is not enabled in Firebase yet.';
    }
    if (error.message.includes('invalid-credential')) {
      return 'That email or password is not correct.';
    }
    if (error.message.includes('email-already-in-use')) {
      return 'An account already exists for that email.';
    }
    if (error.message.includes('weak-password')) {
      return 'Choose a password with at least six characters.';
    }
  }
  return 'Nook could not complete that request. Please try again.';
}

export function AuthScreen({onCreateAccount, onSignIn}: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'signIn' | 'create'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      setError('Enter a valid email and a password of at least six characters.');
      return;
    }

    setError(undefined);
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await onCreateAccount(email, password);
      } else {
        await onSignIn(email, password);
      }
    } catch (authError) {
      setError(readableAuthError(authError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <View style={[styles.hero, {paddingTop: insets.top + 34}]}>
        <Text style={styles.eyebrow}>NOOK</Text>
        <Text style={styles.title}>Your private space.</Text>
        <Text style={styles.subtitle}>
          Sign in to reach the conversations shared only with people you accept.
        </Text>
      </View>

      <View style={[styles.form, {paddingBottom: Math.max(insets.bottom, 24)}]}>
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode('signIn')}
            style={[styles.modeButton, mode === 'signIn' && styles.modeActive]}>
            <Text style={[styles.modeText, mode === 'signIn' && styles.modeTextActive]}>
              Sign in
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('create')}
            style={[styles.modeButton, mode === 'create' && styles.modeActive]}>
            <Text style={[styles.modeText, mode === 'create' && styles.modeTextActive]}>
              Create account
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={email}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={styles.input}
          value={password}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={submit}
          style={({pressed}) => [
            styles.submit,
            (pressed || submitting) && styles.submitPressed,
          ]}>
          <Text style={styles.submitText}>
            {submitting ? 'Please wait…' : mode === 'create' ? 'Create account' : 'Continue'}
          </Text>
        </Pressable>

        <Text style={styles.privacyNote}>
          Your account signs you in. It will not be used as an encryption key.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {backgroundColor: colors.canvas, flex: 1},
  hero: {
    backgroundColor: colors.ink,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 38,
    paddingHorizontal: 24,
  },
  eyebrow: {color: '#A9CEB7', fontSize: 12, fontWeight: '900', letterSpacing: 3},
  title: {color: colors.surface, fontSize: 34, fontWeight: '800', marginTop: 25},
  subtitle: {color: '#B9C8C0', fontSize: 15, lineHeight: 22, marginTop: 10},
  form: {flex: 1, paddingHorizontal: 22, paddingTop: 26},
  modeRow: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 13,
    flexDirection: 'row',
    marginBottom: 24,
    padding: 4,
  },
  modeButton: {alignItems: 'center', borderRadius: 10, flex: 1, paddingVertical: 10},
  modeActive: {backgroundColor: colors.surface},
  modeText: {color: colors.textMuted, fontSize: 13, fontWeight: '700'},
  modeTextActive: {color: colors.text},
  label: {color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 7},
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    marginBottom: 17,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  error: {color: '#A94343', fontSize: 13, lineHeight: 18, marginBottom: 12},
  submit: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 14,
    marginTop: 5,
    paddingVertical: 15,
  },
  submitPressed: {opacity: 0.72},
  submitText: {color: colors.surface, fontSize: 15, fontWeight: '800'},
  privacyNote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 18,
    textAlign: 'center',
  },
});
