import React, {useState} from 'react';
import {Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors} from '../../../theme/colors';
import type {UserProfile} from '../../profile/domain/models';

type Props = {
  accountEmail: string | null;
  onClearOrganizer: () => Promise<void>;
  onDeleteAccount: (password: string) => Promise<void>;
  onOpenPrivateSpace: () => void;
  onSignOut: () => Promise<void>;
  profile: UserProfile;
};

export function OrganizerSettingsScreen({
  accountEmail,
  onClearOrganizer,
  onDeleteAccount,
  onOpenPrivateSpace,
  onSignOut,
  profile,
}: Props) {
  const insets = useSafeAreaInsets();
  const [showDelete, setShowDelete] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  const confirmClear = () => {
    Alert.alert(
      'Clear organizer data?',
      'All reminders, appointments, medicine schedules, and notes on this device will be removed.',
      [
        {style: 'cancel', text: 'Cancel'},
        {onPress: onClearOrganizer, style: 'destructive', text: 'Clear data'},
      ],
    );
  };

  const deleteAccount = async () => {
    if (password.length < 6) {
      setDeleteError('Enter your current account password.');
      return;
    }
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await onDeleteAccount(password);
    } catch {
      setDeleteError('The password was incorrect or deletion could not be completed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, {paddingTop: insets.top + 20}]}>
        <Text style={styles.eyebrow}>NOOK</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Your account, privacy, and additional features.</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 100}]}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{profile.displayName}</Text>
          <Text style={styles.cardText}>{accountEmail ?? 'Private account'}</Text>
        </View>

        <Text style={styles.sectionLabel}>ADDITIONAL FEATURES</Text>
        <Pressable accessibilityRole="button" onPress={onOpenPrivateSpace} style={styles.privateCard}>
          <View style={styles.privateIcon}>
            <Text style={styles.privateIconText}>◈</Text>
          </View>
          <View style={styles.privateCopy}>
            <Text style={styles.privateTitle}>Private Space</Text>
            <Text style={styles.privateText}>PIN-protected, invitation-only conversations.</Text>
          </View>
          <Text style={styles.privateChevron}>›</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>PRIVACY & DATA</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Organizer data stays on this device</Text>
          <Text style={styles.cardText}>
            Nook does not upload your reminders, medicine schedules, appointments, or notes.
          </Text>
          <Pressable onPress={confirmClear} style={styles.textButton}>
            <Text style={styles.destructiveText}>Clear organizer data</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>About protected messaging</Text>
          <Text style={styles.cardText}>
            Private Space is intentionally separate, but it is a disclosed Nook capability. Chat push notifications are
            disabled in this beta.
          </Text>
        </View>

        <Pressable onPress={onSignOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
        <Pressable onPress={() => setShowDelete(true)} style={styles.deleteAccount}>
          <Text style={styles.deleteAccountText}>Delete account</Text>
        </Pressable>
        <Text style={styles.version}>Nook beta · 0.1.0</Text>
      </ScrollView>
      <Modal animationType="fade" onRequestClose={() => setShowDelete(false)} transparent visible={showDelete}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete your Nook account?</Text>
            <Text style={styles.modalText}>
              This permanently removes your account and profile, disconnects your contacts, and clears organizer and
              Private Space data from this device. Safety reports may be retained.
            </Text>
            <Text style={styles.modalLabel}>Current password</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={styles.modalInput}
              value={password}
            />
            {deleteError ? <Text style={styles.modalError}>{deleteError}</Text> : null}
            <Pressable disabled={deleting} onPress={deleteAccount} style={styles.modalDelete}>
              <Text style={styles.modalDeleteText}>{deleting ? 'Deleting…' : 'Permanently delete account'}</Text>
            </Pressable>
            <Pressable
              disabled={deleting}
              onPress={() => {
                setShowDelete(false);
                setPassword('');
                setDeleteError(undefined);
              }}
              style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {backgroundColor: colors.canvas, flex: 1},
  header: {
    backgroundColor: colors.ink,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 25,
    paddingHorizontal: 22,
  },
  eyebrow: {color: '#A9CEB7', fontSize: 10, fontWeight: '900', letterSpacing: 2.2},
  title: {color: colors.surface, fontSize: 34, fontWeight: '800', marginTop: 12},
  subtitle: {color: '#B9C8C0', fontSize: 13, lineHeight: 19, marginTop: 5},
  content: {padding: 17},
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 8,
    marginTop: 18,
  },
  card: {backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, padding: 16},
  cardTitle: {color: colors.text, fontSize: 15, fontWeight: '800'},
  cardText: {color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5},
  privateCard: {alignItems: 'center', backgroundColor: colors.ink, borderRadius: 18, flexDirection: 'row', padding: 17},
  privateIcon: {
    alignItems: 'center',
    backgroundColor: '#365246',
    borderRadius: 14,
    height: 45,
    justifyContent: 'center',
    marginRight: 13,
    width: 45,
  },
  privateIconText: {color: '#B9D8C5', fontSize: 22},
  privateCopy: {flex: 1},
  privateTitle: {color: colors.surface, fontSize: 16, fontWeight: '800'},
  privateText: {color: '#B9C8C0', fontSize: 11, lineHeight: 16, marginTop: 3},
  privateChevron: {color: '#B9C8C0', fontSize: 27, marginLeft: 8},
  textButton: {alignSelf: 'flex-start', marginTop: 13, paddingVertical: 5},
  destructiveText: {color: '#A94343', fontSize: 12, fontWeight: '800'},
  signOut: {
    alignItems: 'center',
    borderColor: colors.inkSoft,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 24,
    paddingVertical: 14,
  },
  signOutText: {color: colors.inkSoft, fontSize: 14, fontWeight: '800'},
  deleteAccount: {alignItems: 'center', marginTop: 12, paddingVertical: 10},
  deleteAccountText: {color: '#A94343', fontSize: 12, fontWeight: '800'},
  version: {color: colors.textMuted, fontSize: 10, marginTop: 16, textAlign: 'center'},
  modalBackdrop: {backgroundColor: 'rgba(12, 25, 20, 0.6)', flex: 1, justifyContent: 'center', padding: 22},
  modalCard: {backgroundColor: colors.surface, borderRadius: 20, padding: 21},
  modalTitle: {color: colors.text, fontSize: 20, fontWeight: '800'},
  modalText: {color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 8},
  modalLabel: {color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: 7, marginTop: 18},
  modalInput: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  modalError: {color: '#A94343', fontSize: 12, lineHeight: 17, marginTop: 10},
  modalDelete: {alignItems: 'center', backgroundColor: '#A94343', borderRadius: 12, marginTop: 18, paddingVertical: 13},
  modalDeleteText: {color: colors.surface, fontSize: 13, fontWeight: '800'},
  modalCancel: {alignItems: 'center', marginTop: 8, paddingVertical: 11},
  modalCancelText: {color: colors.inkSoft, fontSize: 13, fontWeight: '800'},
});
