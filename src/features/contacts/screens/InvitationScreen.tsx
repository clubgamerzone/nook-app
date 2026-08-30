import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

import type {UserProfile} from '../../profile/domain/models';
import {colors} from '../../../theme/colors';
import {FirebaseInvitationService} from '../data/FirebaseInvitationService';
import type {CreatedInvitation, InvitationPreview} from '../domain/models';

type Props = {
  onBack: () => void;
  profile: UserProfile;
};

function formatExpiry(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function readableInviteError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('own-code')) {
      return 'That is your own invitation. Share it with someone else.';
    }
    if (error.message.includes('expired')) {
      return 'That invitation has expired. Ask for a new one.';
    }
    if (error.message.includes('not-found') || error.message.includes('not-available')) {
      return 'That invitation is invalid or is no longer available.';
    }
    if (error.message.includes('permission-denied')) {
      return 'Firestore rules have not been deployed for invitations yet.';
    }
  }
  return 'Nook could not complete that request. Check your connection and try again.';
}

export function InvitationScreen({onBack, profile}: Props) {
  const insets = useSafeAreaInsets();
  const service = useMemo(() => new FirebaseInvitationService(), []);
  const [created, setCreated] = useState<CreatedInvitation>();
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<InvitationPreview>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const createInvitation = async () => {
    setBusy(true);
    setError(undefined);
    try {
      setCreated(await service.create(profile));
    } catch (inviteError) {
      setError(readableInviteError(inviteError));
    } finally {
      setBusy(false);
    }
  };

  const reviewInvitation = async () => {
    if (!code.trim()) {
      setError('Paste or enter an invitation code first.');
      return;
    }
    setBusy(true);
    setError(undefined);
    setPreview(undefined);
    try {
      setPreview(await service.preview(code, profile.uid));
    } catch (inviteError) {
      setError(readableInviteError(inviteError));
    } finally {
      setBusy(false);
    }
  };

  const acceptInvitation = async () => {
    if (!preview) {
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await service.accept(preview, profile);
      onBack();
    } catch (inviteError) {
      setError(readableInviteError(inviteError));
    } finally {
      setBusy(false);
    }
  };

  const rejectInvitation = async () => {
    if (!preview) {
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await service.reject(preview, profile.uid);
      setPreview(undefined);
      setCode('');
    } catch (inviteError) {
      setError(readableInviteError(inviteError));
    } finally {
      setBusy(false);
    }
  };

  const shareInvitation = async () => {
    if (!created) {
      return;
    }
    await Share.share({
      message: created.code,
    });
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, {paddingTop: insets.top + 16}]}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Add a person</Text>
          <Text style={styles.subtitle}>No searching. Connect only with a private code.</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 28)}]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>INVITE SOMEONE</Text>
          <Text style={styles.cardTitle}>Create a one-time invitation</Text>
          <Text style={styles.cardText}>It expires after 24 hours and becomes unusable when accepted or rejected.</Text>
          {created ? (
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Invitation code</Text>
              <Text selectable style={styles.codeValue}>
                {created.code}
              </Text>
              <Text style={styles.expiry}>Expires {formatExpiry(created.expiresAt)}</Text>
              <View style={styles.qrBox}>
                <QRCode backgroundColor={colors.surface} size={176} value={created.code} />
              </View>
              <Text style={styles.qrHelp}>Scan to read the invitation code.</Text>
              <Pressable onPress={shareInvitation} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Share invitation</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              disabled={busy}
              onPress={createInvitation}
              style={({pressed}) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>{busy ? 'Creating…' : 'Create invitation'}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.or}>OR</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>JOIN SOMEONE</Text>
          <Text style={styles.cardTitle}>Enter an invitation code</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={value => {
              setCode(value.trim());
              setPreview(undefined);
            }}
            placeholder="Paste code"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={code}
          />
          {!preview ? (
            <Pressable
              disabled={busy}
              onPress={reviewInvitation}
              style={({pressed}) => [styles.secondaryButton, pressed && styles.pressed]}>
              <Text style={styles.secondaryButtonText}>{busy ? 'Checking…' : 'Review invitation'}</Text>
            </Pressable>
          ) : (
            <View style={styles.identityCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{preview.inviterDisplayName.slice(0, 1).toUpperCase()}</Text>
              </View>
              <Text style={styles.identityLabel}>Invitation from</Text>
              <Text style={styles.identityName}>{preview.inviterDisplayName}</Text>
              <Text style={styles.expiry}>Expires {formatExpiry(preview.expiresAt)}</Text>
              <View style={styles.actionRow}>
                <Pressable disabled={busy} onPress={rejectInvitation} style={styles.rejectButton}>
                  <Text style={styles.rejectText}>Reject</Text>
                </Pressable>
                <Pressable disabled={busy} onPress={acceptInvitation} style={styles.acceptButton}>
                  <Text style={styles.acceptText}>{busy ? 'Connecting…' : 'Accept'}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.privacyNote}>
          Knowing someone’s email, phone number, or display name is never enough to contact them.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {backgroundColor: colors.canvas, flex: 1},
  header: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    paddingBottom: 24,
    paddingHorizontal: 18,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#23362F',
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  backText: {
    color: colors.surface,
    fontSize: 31,
    lineHeight: 32,
    marginTop: -2,
  },
  headerText: {flex: 1, marginLeft: 14},
  title: {color: colors.surface, fontSize: 25, fontWeight: '800'},
  subtitle: {color: '#B9C8C0', fontSize: 12, marginTop: 4},
  content: {padding: 18, paddingTop: 22},
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 19,
    borderWidth: 1,
    padding: 19,
  },
  cardEyebrow: {
    color: colors.sage,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 8,
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 13,
    marginTop: 18,
    paddingVertical: 14,
  },
  primaryButtonText: {color: colors.surface, fontSize: 14, fontWeight: '800'},
  pressed: {opacity: 0.72},
  codeBox: {marginTop: 18},
  codeLabel: {color: colors.textMuted, fontSize: 11, fontWeight: '700'},
  codeValue: {
    color: colors.inkSoft,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 6,
  },
  expiry: {color: colors.textMuted, fontSize: 11, marginTop: 7},
  qrBox: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginTop: 18,
    padding: 12,
  },
  qrHelp: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 7,
    textAlign: 'center',
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 19,
  },
  divider: {backgroundColor: colors.border, flex: 1, height: 1},
  or: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    marginHorizontal: 12,
  },
  input: {
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    marginTop: 17,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.inkSoft,
    borderRadius: 13,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 13,
  },
  secondaryButtonText: {
    color: colors.inkSoft,
    fontSize: 14,
    fontWeight: '800',
  },
  identityCard: {alignItems: 'center', marginTop: 20},
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.sageLight,
    borderRadius: 27,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  avatarText: {color: colors.inkSoft, fontSize: 20, fontWeight: '900'},
  identityLabel: {color: colors.textMuted, fontSize: 11, marginTop: 11},
  identityName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 3,
  },
  actionRow: {flexDirection: 'row', gap: 10, marginTop: 17, width: '100%'},
  rejectButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  rejectText: {color: colors.textMuted, fontSize: 13, fontWeight: '800'},
  acceptButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
  acceptText: {color: colors.surface, fontSize: 13, fontWeight: '800'},
  error: {
    color: '#A94343',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
    textAlign: 'center',
  },
  privacyNote: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 20,
    textAlign: 'center',
  },
});
