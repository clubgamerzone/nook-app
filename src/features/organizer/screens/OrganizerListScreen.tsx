import React from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors} from '../../../theme/colors';
import {ORGANIZER_TYPE_LABELS, type OrganizerItem} from '../domain/models';

type Mode = 'agenda' | 'notes' | 'today';

type Props = {
  error?: string;
  items: OrganizerItem[];
  loading: boolean;
  mode: Mode;
  onCreate: () => void;
  onOpen: (item: OrganizerItem) => void;
  onToggle: (item: OrganizerItem) => void;
};

function sameLocalDay(date: Date, reference: Date) {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function itemTime(item: OrganizerItem) {
  if (!item.scheduledAt) {
    return '';
  }
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(item.scheduledAt));
}

function subtitle(mode: Mode) {
  if (mode === 'today') {
    return 'What needs your attention today.';
  }
  if (mode === 'agenda') {
    return 'Everything scheduled, in chronological order.';
  }
  return 'Thoughts and details kept on this device.';
}

export function OrganizerListScreen({error, items, loading, mode, onCreate, onOpen, onToggle}: Props) {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const visibleItems = items
    .filter(item => {
      if (mode === 'notes') {
        return item.type === 'note';
      }
      if (item.type === 'note' || !item.scheduledAt) {
        return false;
      }
      const scheduled = new Date(item.scheduledAt);
      return mode === 'agenda' || sameLocalDay(scheduled, now) || (scheduled < now && !item.completed);
    })
    .sort((left, right) => (left.scheduledAt ?? '').localeCompare(right.scheduledAt ?? ''));

  return (
    <View style={styles.screen}>
      <View style={[styles.header, {paddingTop: insets.top + 20}]}>
        <Text style={styles.eyebrow}>NOOK ORGANIZER</Text>
        <Text style={styles.title}>{mode === 'today' ? 'Today' : mode === 'agenda' ? 'Agenda' : 'Notes'}</Text>
        <Text style={styles.subtitle}>{subtitle(mode)}</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 110}]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={colors.sage} style={styles.loader} /> : null}
        {!loading && visibleItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>{mode === 'notes' ? '✎' : '○'}</Text>
            <Text style={styles.emptyTitle}>{mode === 'notes' ? 'A quiet page' : 'Nothing scheduled here'}</Text>
            <Text style={styles.emptyText}>
              {mode === 'notes'
                ? 'Create a note for anything you want nearby.'
                : 'Add a reminder, medicine schedule, or appointment.'}
            </Text>
          </View>
        ) : null}
        {visibleItems.map(item => {
          const overdue = Boolean(
            item.scheduledAt && new Date(item.scheduledAt).getTime() < Date.now() && !item.completed,
          );
          return (
            <Pressable accessibilityRole="button" key={item.id} onPress={() => onOpen(item)} style={styles.itemCard}>
              <Pressable
                accessibilityLabel={item.completed ? `Mark ${item.title} incomplete` : `Complete ${item.title}`}
                accessibilityRole="checkbox"
                accessibilityState={{checked: item.completed}}
                onPress={() => onToggle(item)}
                style={[styles.check, item.completed && styles.checkComplete]}>
                <Text style={styles.checkText}>{item.completed ? '✓' : ''}</Text>
              </Pressable>
              <View style={styles.itemBody}>
                <View style={styles.itemTopRow}>
                  <Text style={styles.itemKind}>{ORGANIZER_TYPE_LABELS[item.type].toUpperCase()}</Text>
                  {overdue ? <Text style={styles.overdue}>OVERDUE</Text> : null}
                </View>
                <Text numberOfLines={2} style={[styles.itemTitle, item.completed && styles.itemComplete]}>
                  {item.title}
                </Text>
                {item.scheduledAt ? <Text style={styles.itemMeta}>{itemTime(item)}</Text> : null}
                {item.type === 'medicine' && item.dosage ? <Text style={styles.itemMeta}>{item.dosage}</Text> : null}
                {item.details ? (
                  <Text numberOfLines={2} style={styles.itemDetails}>
                    {item.details}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        accessibilityLabel="Create organizer item"
        accessibilityRole="button"
        onPress={onCreate}
        style={styles.fab}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
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
  content: {gap: 11, paddingHorizontal: 16, paddingTop: 18},
  error: {backgroundColor: '#F7E8E5', borderRadius: 10, color: '#923E38', fontSize: 12, padding: 12},
  loader: {marginTop: 35},
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 19,
    borderWidth: 1,
    marginTop: 12,
    padding: 30,
  },
  emptyIcon: {color: colors.sage, fontSize: 30},
  emptyTitle: {color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 12},
  emptyText: {color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 7, textAlign: 'center'},
  itemCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 15,
  },
  check: {
    alignItems: 'center',
    borderColor: colors.sage,
    borderRadius: 10,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    marginRight: 13,
    width: 24,
  },
  checkComplete: {backgroundColor: colors.sage},
  checkText: {color: colors.surface, fontSize: 14, fontWeight: '900'},
  itemBody: {flex: 1},
  itemTopRow: {alignItems: 'center', flexDirection: 'row', gap: 8},
  itemKind: {color: colors.sage, fontSize: 9, fontWeight: '900', letterSpacing: 1.1},
  overdue: {color: '#A94343', fontSize: 9, fontWeight: '900', letterSpacing: 0.8},
  itemTitle: {color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 4},
  itemComplete: {color: colors.textMuted, textDecorationLine: 'line-through'},
  itemMeta: {color: colors.inkSoft, fontSize: 12, fontWeight: '700', marginTop: 5},
  itemDetails: {color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 5},
  chevron: {color: colors.textMuted, fontSize: 24, marginLeft: 8},
  fab: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 27,
    bottom: 82,
    elevation: 5,
    height: 54,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    width: 54,
  },
  fabText: {color: colors.surface, fontSize: 28, lineHeight: 31},
});
