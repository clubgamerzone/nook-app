import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors} from '../../../theme/colors';
import {ChatPrototype} from '../../chat/screens/ChatPrototype';
import type {UserProfile} from '../../profile/domain/models';
import {PrivateLockService, type PrivateLockConfiguration} from '../lock/PrivateLockService';

type Props = {
  accountEmail: string | null;
  lockSignal: number;
  onExit: () => void;
  onSignOut: () => Promise<void>;
  profile: UserProfile;
};

export function PrivateSpaceGate({accountEmail, lockSignal, onExit, onSignOut, profile}: Props) {
  const insets = useSafeAreaInsets();
  const service = useMemo(() => new PrivateLockService(), []);
  const [configuration, setConfiguration] = useState<PrivateLockConfiguration | null>();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometryAvailable, setBiometryAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [error, setError] = useState<string>();

  useEffect(() => {
    Promise.all([service.load(profile.uid), service.supportedBiometry(), service.loadAttemptState(profile.uid)])
      .then(([stored, biometry, attemptState]) => {
        setConfiguration(stored);
        setBiometryAvailable(Boolean(biometry));
        setFailedAttempts(attemptState.failures);
        setBlockedUntil(attemptState.blockedUntil);
      })
      .catch(() => {
        setConfiguration(null);
        setError('Private Space security could not be initialized.');
      });
  }, [profile.uid, service]);

  useEffect(() => {
    if (lockSignal > 0) {
      setUnlocked(false);
      setPin('');
    }
  }, [lockSignal]);

  const createLock = async () => {
    if (!/^\d{4,8}$/.test(pin)) {
      setError('Choose a PIN containing 4 to 8 digits.');
      return;
    }
    if (pin !== confirmation) {
      setError('The PIN confirmation does not match.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const created = await service.create(profile.uid, pin, biometricEnabled && biometryAvailable);
      setConfiguration(created);
      setPin('');
      setConfirmation('');
      setUnlocked(true);
    } catch {
      setError('Nook could not protect Private Space on this device.');
    } finally {
      setBusy(false);
    }
  };

  const unlock = async () => {
    if (!configuration || busy) {
      return;
    }
    const now = Date.now();
    if (blockedUntil > now) {
      setError(`Try again in ${Math.ceil((blockedUntil - now) / 1000)} seconds.`);
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      if (await service.verify(pin, configuration)) {
        await service.clearFailures(profile.uid);
        setFailedAttempts(0);
        setPin('');
        setUnlocked(true);
      } else {
        const attemptState = await service.recordFailure(profile.uid, failedAttempts);
        setFailedAttempts(attemptState.failures);
        setBlockedUntil(attemptState.blockedUntil);
        setError(attemptState.delay ? `Incorrect PIN. Try again in ${attemptState.delay} seconds.` : 'Incorrect PIN.');
      }
    } finally {
      setBusy(false);
    }
  };

  const biometricUnlock = async () => {
    setBusy(true);
    setError(undefined);
    try {
      if (await service.unlockWithBiometrics(profile.uid)) {
        setUnlocked(true);
      }
    } catch {
      setError('Biometric unlock was not completed. Use your PIN instead.');
    } finally {
      setBusy(false);
    }
  };

  if (configuration === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  if (unlocked) {
    return <ChatPrototype accountEmail={accountEmail} onExit={onExit} onSignOut={onSignOut} profile={profile} />;
  }

  const settingUp = configuration === null;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <View style={[styles.hero, {paddingTop: insets.top + 16}]}>
        <Pressable accessibilityRole="button" onPress={onExit} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.eyebrow}>PRIVATE SPACE</Text>
        <Text style={styles.title}>{settingUp ? 'Create your private lock' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>
          {settingUp
            ? 'Your PIN stays on this device and is stored only as a memory-hard verifier.'
            : 'Unlock to reach your invitation-only conversations.'}
        </Text>
      </View>
      <View style={[styles.form, {paddingBottom: Math.max(insets.bottom, 22)}]}>
        <Text style={styles.label}>{settingUp ? 'New PIN' : 'Private PIN'}</Text>
        <TextInput
          accessibilityLabel="Private Space PIN"
          autoFocus
          keyboardType="number-pad"
          maxLength={8}
          onChangeText={value => setPin(value.replace(/\D/g, ''))}
          onSubmitEditing={settingUp ? undefined : unlock}
          placeholder="4–8 digits"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={styles.input}
          value={pin}
        />
        {settingUp ? (
          <>
            <Text style={styles.label}>Confirm PIN</Text>
            <TextInput
              keyboardType="number-pad"
              maxLength={8}
              onChangeText={value => setConfirmation(value.replace(/\D/g, ''))}
              placeholder="Enter it again"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={styles.input}
              value={confirmation}
            />
            {biometryAvailable ? (
              <View style={styles.biometricRow}>
                <View style={styles.biometricCopy}>
                  <Text style={styles.biometricTitle}>Use biometrics</Text>
                  <Text style={styles.biometricHelp}>Face or fingerprint unlock, with PIN fallback.</Text>
                </View>
                <Switch onValueChange={setBiometricEnabled} value={biometricEnabled} />
              </View>
            ) : null}
          </>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable disabled={busy} onPress={settingUp ? createLock : unlock} style={styles.primary}>
          <Text style={styles.primaryText}>
            {busy ? 'Please wait…' : settingUp ? 'Protect Private Space' : 'Unlock'}
          </Text>
        </Pressable>
        {!settingUp && configuration.biometricEnabled ? (
          <Pressable disabled={busy} onPress={biometricUnlock} style={styles.secondary}>
            <Text style={styles.secondaryText}>Unlock with biometrics</Text>
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loading: {alignItems: 'center', backgroundColor: colors.ink, flex: 1, justifyContent: 'center'},
  screen: {backgroundColor: colors.canvas, flex: 1},
  hero: {
    backgroundColor: colors.ink,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 34,
    paddingHorizontal: 24,
  },
  back: {height: 40, justifyContent: 'center', marginLeft: -8, width: 40},
  backText: {color: colors.surface, fontSize: 38, lineHeight: 39},
  eyebrow: {color: '#A9CEB7', fontSize: 11, fontWeight: '900', letterSpacing: 2.5, marginTop: 15},
  title: {color: colors.surface, fontSize: 30, fontWeight: '800', marginTop: 16},
  subtitle: {color: '#B9C8C0', fontSize: 14, lineHeight: 21, marginTop: 9},
  form: {padding: 22},
  label: {color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: 7, marginTop: 12},
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 20,
    letterSpacing: 7,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  biometricRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 20,
    padding: 14,
  },
  biometricCopy: {flex: 1, marginRight: 12},
  biometricTitle: {color: colors.text, fontSize: 14, fontWeight: '800'},
  biometricHelp: {color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 3},
  error: {color: '#A94343', fontSize: 12, lineHeight: 18, marginTop: 15},
  primary: {alignItems: 'center', backgroundColor: colors.ink, borderRadius: 14, marginTop: 22, paddingVertical: 15},
  primaryText: {color: colors.surface, fontSize: 15, fontWeight: '800'},
  secondary: {
    alignItems: 'center',
    borderColor: colors.sage,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 11,
    paddingVertical: 14,
  },
  secondaryText: {color: colors.inkSoft, fontSize: 14, fontWeight: '800'},
});
