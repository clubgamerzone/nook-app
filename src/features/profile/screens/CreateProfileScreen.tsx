import React, {useState} from 'react';
import {KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors} from '../../../theme/colors';

type Props = {
  accountEmail: string | null;
  initialError?: string;
  onCreate: (displayName: string) => Promise<void>;
  onSignOut: () => Promise<void>;
};

export function CreateProfileScreen({accountEmail, initialError, onCreate, onSignOut}: Props) {
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(initialError);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const normalizedName = displayName.trim().replace(/\s+/g, ' ');
    if (normalizedName.length < 2 || normalizedName.length > 40) {
      setError('Choose a name between 2 and 40 characters.');
      return;
    }

    setError(undefined);
    setSubmitting(true);
    try {
      await onCreate(normalizedName);
    } catch {
      setError('Nook could not save your name. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <View style={[styles.hero, {paddingTop: insets.top + 36}]}>
        <Text style={styles.eyebrow}>YOUR NOOK</Text>
        <Text style={styles.title}>What should your people call you?</Text>
        <Text style={styles.subtitle}>This name appears only on invitations and to contacts you accept.</Text>
      </View>

      <View style={[styles.form, {paddingBottom: Math.max(insets.bottom, 24)}]}>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={40}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          style={styles.input}
          value={displayName}
        />
        <Text style={styles.helper}>No public profile or searchable username is created.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={submit}
          style={({pressed}) => [styles.submit, (pressed || submitting) && styles.pressed]}>
          <Text style={styles.submitText}>{submitting ? 'Saving…' : 'Continue'}</Text>
        </Pressable>

        <View style={styles.accountRow}>
          <Text numberOfLines={1} style={styles.accountText}>
            {accountEmail ?? 'Private account'}
          </Text>
          <Pressable accessibilityRole="button" onPress={onSignOut}>
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
        </View>
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
  eyebrow: {color: '#A9CEB7', fontSize: 12, fontWeight: '900', letterSpacing: 2.5},
  title: {color: colors.surface, fontSize: 31, fontWeight: '800', marginTop: 23},
  subtitle: {color: '#B9C8C0', fontSize: 15, lineHeight: 22, marginTop: 11},
  form: {flex: 1, paddingHorizontal: 22, paddingTop: 30},
  label: {color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8},
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 17,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  helper: {color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 9},
  error: {color: '#A94343', fontSize: 13, lineHeight: 18, marginTop: 16},
  submit: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 14,
    marginTop: 25,
    paddingVertical: 15,
  },
  pressed: {opacity: 0.72},
  submitText: {color: colors.surface, fontSize: 15, fontWeight: '800'},
  accountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  accountText: {color: colors.textMuted, flex: 1, fontSize: 12, marginRight: 12},
  signOut: {color: colors.inkSoft, fontSize: 12, fontWeight: '800'},
});
