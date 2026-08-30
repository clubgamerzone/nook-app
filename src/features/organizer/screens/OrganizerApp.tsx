import React, {useEffect, useState} from 'react';
import {AppState, NativeModules, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors} from '../../../theme/colors';
import {PrivateSpaceGate} from '../../privateSpace/screens/PrivateSpaceGate';
import type {UserProfile} from '../../profile/domain/models';
import type {OrganizerDraft, OrganizerItem, OrganizerItemType} from '../domain/models';
import {useOrganizer} from '../hooks/useOrganizer';
import {OrganizerItemScreen} from './OrganizerItemScreen';
import {OrganizerListScreen} from './OrganizerListScreen';
import {OrganizerSettingsScreen} from './OrganizerSettingsScreen';

type Tab = 'agenda' | 'notes' | 'settings' | 'today';
type Route = 'editor' | 'main' | 'private';

const TABS: Array<{icon: string; label: string; value: Tab}> = [
  {icon: '⌂', label: 'Today', value: 'today'},
  {icon: '▤', label: 'Agenda', value: 'agenda'},
  {icon: '✎', label: 'Notes', value: 'notes'},
  {icon: '⚙', label: 'Settings', value: 'settings'},
];

type Props = {
  accountEmail: string | null;
  onDeleteAccount: (password: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  profile: UserProfile;
};

export function OrganizerApp({accountEmail, onDeleteAccount, onSignOut, profile}: Props) {
  const insets = useSafeAreaInsets();
  const organizer = useOrganizer(profile.uid);
  const [tab, setTab] = useState<Tab>('today');
  const [route, setRoute] = useState<Route>('main');
  const [editing, setEditing] = useState<OrganizerItem>();
  const [newType, setNewType] = useState<OrganizerItemType>('reminder');
  const [privacyCover, setPrivacyCover] = useState(false);
  const [lockSignal, setLockSignal] = useState(0);

  useEffect(() => {
    NativeModules.NookPrivacy?.setSecureScreen(route === 'private');
    return () => NativeModules.NookPrivacy?.setSecureScreen(false);
  }, [route]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        setPrivacyCover(true);
        setLockSignal(value => value + 1);
        setRoute('main');
        setTab('today');
      } else {
        requestAnimationFrame(() => setPrivacyCover(false));
      }
    });
    return () => subscription.remove();
  }, []);

  const create = (type: OrganizerItemType) => {
    setEditing(undefined);
    setNewType(type);
    setRoute('editor');
  };

  const save = async (draft: OrganizerDraft, initial?: OrganizerItem) => {
    if (initial) {
      await organizer.update({...initial, ...draft});
    } else {
      await organizer.create(draft);
    }
  };

  const toggleItem = async (item: OrganizerItem) => {
    if (!item.completed && item.repeat !== 'none' && item.scheduledAt) {
      const next = new Date(item.scheduledAt);
      next.setDate(next.getDate() + (item.repeat === 'daily' ? 1 : 7));
      await organizer.update({...item, completed: false, scheduledAt: next.toISOString()});
      return;
    }
    await organizer.update({...item, completed: !item.completed});
  };

  if (route === 'private') {
    return (
      <PrivateSpaceGate
        accountEmail={accountEmail}
        lockSignal={lockSignal}
        onExit={() => setRoute('main')}
        onSignOut={onSignOut}
        profile={profile}
      />
    );
  }

  if (route === 'editor') {
    return (
      <OrganizerItemScreen
        initial={editing}
        initialType={newType}
        onBack={() => setRoute('main')}
        onDelete={organizer.remove}
        onSave={save}
      />
    );
  }

  return (
    <View style={styles.screen}>
      {tab === 'settings' ? (
        <OrganizerSettingsScreen
          accountEmail={accountEmail}
          onClearOrganizer={organizer.clear}
          onDeleteAccount={onDeleteAccount}
          onOpenPrivateSpace={() => setRoute('private')}
          onSignOut={onSignOut}
          profile={profile}
        />
      ) : (
        <OrganizerListScreen
          error={organizer.error}
          items={organizer.items}
          loading={organizer.loading}
          mode={tab}
          onCreate={() => create(tab === 'notes' ? 'note' : 'reminder')}
          onOpen={item => {
            setEditing(item);
            setRoute('editor');
          }}
          onToggle={toggleItem}
        />
      )}
      <View style={[styles.tabBar, {paddingBottom: Math.max(insets.bottom, 8)}]}>
        {TABS.map(item => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{selected: tab === item.value}}
            key={item.value}
            onPress={() => setTab(item.value)}
            style={styles.tab}>
            <Text style={[styles.tabIcon, tab === item.value && styles.tabActive]}>{item.icon}</Text>
            <Text style={[styles.tabLabel, tab === item.value && styles.tabActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      {privacyCover ? (
        <View style={styles.privacyCover}>
          <Text style={styles.coverBrand}>NOOK</Text>
          <Text style={styles.coverTitle}>Today</Text>
          <Text style={styles.coverText}>Your day, calmly organized.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {backgroundColor: colors.canvas, flex: 1},
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
  },
  tab: {alignItems: 'center', flex: 1, gap: 2, minHeight: 48},
  tabIcon: {color: colors.textMuted, fontSize: 20},
  tabLabel: {color: colors.textMuted, fontSize: 10, fontWeight: '700'},
  tabActive: {color: colors.ink, fontWeight: '900'},
  privacyCover: {
    backgroundColor: colors.ink,
    bottom: 0,
    left: 0,
    padding: 28,
    paddingTop: 90,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  coverBrand: {color: '#A9CEB7', fontSize: 12, fontWeight: '900', letterSpacing: 3},
  coverTitle: {color: colors.surface, fontSize: 38, fontWeight: '800', marginTop: 28},
  coverText: {color: '#B9C8C0', fontSize: 15, marginTop: 8},
});
