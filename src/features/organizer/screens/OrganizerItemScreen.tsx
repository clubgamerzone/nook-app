import React, {useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors} from '../../../theme/colors';
import {
  ORGANIZER_TYPE_LABELS,
  type OrganizerDraft,
  type OrganizerItem,
  type OrganizerItemType,
  type OrganizerRepeat,
} from '../domain/models';

const TYPES: OrganizerItemType[] = ['reminder', 'medicine', 'appointment', 'note'];
const REPEATS: OrganizerRepeat[] = ['none', 'daily', 'weekly'];

type Props = {
  initial?: OrganizerItem;
  initialType?: OrganizerItemType;
  onBack: () => void;
  onDelete: (item: OrganizerItem) => Promise<void>;
  onSave: (draft: OrganizerDraft, initial?: OrganizerItem) => Promise<void>;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function initialDateParts(item?: OrganizerItem) {
  const date = item?.scheduledAt ? new Date(item.scheduledAt) : new Date(Date.now() + 60 * 60 * 1000);
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function localIso(date: string, time: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match || !timeMatch) {
    return undefined;
  }
  const value = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  );
  if (
    !Number.isFinite(value.getTime()) ||
    value.getFullYear() !== Number(match[1]) ||
    value.getMonth() !== Number(match[2]) - 1 ||
    value.getDate() !== Number(match[3]) ||
    value.getHours() !== Number(timeMatch[1]) ||
    value.getMinutes() !== Number(timeMatch[2])
  ) {
    return undefined;
  }
  return value.toISOString();
}

export function OrganizerItemScreen({initial, initialType, onBack, onDelete, onSave}: Props) {
  const insets = useSafeAreaInsets();
  const dateParts = useMemo(() => initialDateParts(initial), [initial]);
  const [type, setType] = useState<OrganizerItemType>(initial?.type ?? initialType ?? 'reminder');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [details, setDetails] = useState(initial?.details ?? '');
  const [date, setDate] = useState(dateParts.date);
  const [time, setTime] = useState(dateParts.time);
  const [dosage, setDosage] = useState(initial?.dosage ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [repeat, setRepeat] = useState<OrganizerRepeat>(initial?.repeat ?? 'none');
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    const scheduledAt = type === 'note' ? undefined : localIso(date, time);
    if (title.trim().length < 2) {
      setError('Enter a title with at least two characters.');
      return;
    }
    if (type !== 'note' && !scheduledAt) {
      setError('Use date YYYY-MM-DD and time HH:MM.');
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      await onSave(
        {
          active,
          details: details.trim(),
          dosage: dosage.trim() || undefined,
          location: location.trim() || undefined,
          repeat,
          scheduledAt,
          title: title.trim(),
          type,
        },
        initial,
      );
      onBack();
    } catch {
      setError('Nook could not save this item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!initial) {
      return;
    }
    Alert.alert('Delete this item?', 'This removes it and cancels its device alert.', [
      {style: 'cancel', text: 'Cancel'},
      {
        onPress: async () => {
          await onDelete(initial);
          onBack();
        },
        style: 'destructive',
        text: 'Delete',
      },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <View style={[styles.header, {paddingTop: insets.top + 10}]}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{initial ? 'Edit item' : 'New item'}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.form, {paddingBottom: insets.bottom + 30}]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Type</Text>
        <View style={styles.choiceWrap}>
          {TYPES.map(value => (
            <Pressable
              key={value}
              onPress={() => setType(value)}
              style={[styles.choice, type === value && styles.choiceSelected]}>
              <Text style={[styles.choiceText, type === value && styles.choiceTextSelected]}>
                {ORGANIZER_TYPE_LABELS[value]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput
          maxLength={100}
          onChangeText={setTitle}
          placeholder="What do you need?"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={title}
        />

        {type !== 'note' ? (
          <>
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={date}
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Time</Text>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                  onChangeText={setTime}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={time}
                />
              </View>
            </View>
            <Text style={styles.label}>Repeat</Text>
            <View style={styles.choiceWrap}>
              {REPEATS.map(value => (
                <Pressable
                  key={value}
                  onPress={() => setRepeat(value)}
                  style={[styles.choice, repeat === value && styles.choiceSelected]}>
                  <Text style={[styles.choiceText, repeat === value && styles.choiceTextSelected]}>
                    {value[0].toUpperCase() + value.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {type === 'medicine' ? (
          <>
            <Text style={styles.label}>Dosage</Text>
            <TextInput
              onChangeText={setDosage}
              placeholder="For example: 1 tablet"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={dosage}
            />
          </>
        ) : null}
        {type === 'appointment' ? (
          <>
            <Text style={styles.label}>Location</Text>
            <TextInput
              onChangeText={setLocation}
              placeholder="Optional location"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={location}
            />
          </>
        ) : null}

        <Text style={styles.label}>{type === 'note' ? 'Note' : 'Details'}</Text>
        <TextInput
          multiline
          onChangeText={setDetails}
          placeholder="Optional details"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.textarea]}
          textAlignVertical="top"
          value={details}
        />

        {type !== 'note' ? (
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Device alert</Text>
              <Text style={styles.switchHelp}>Scheduled locally on this phone.</Text>
            </View>
            <Switch
              onValueChange={setActive}
              trackColor={{false: colors.border, true: colors.sageLight}}
              thumbColor={active ? colors.sage : '#888'}
              value={active}
            />
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable disabled={saving} onPress={submit} style={styles.save}>
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save item'}</Text>
        </Pressable>
        {initial ? (
          <Pressable onPress={confirmDelete} style={styles.delete}>
            <Text style={styles.deleteText}>Delete item</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {backgroundColor: colors.canvas, flex: 1},
  header: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    flexDirection: 'row',
    paddingBottom: 14,
    paddingHorizontal: 14,
  },
  back: {alignItems: 'center', height: 42, justifyContent: 'center', width: 42},
  backText: {color: colors.surface, fontSize: 38, lineHeight: 39},
  headerTitle: {color: colors.surface, flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center'},
  headerSpacer: {width: 42},
  form: {padding: 20},
  label: {color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: 7, marginTop: 16},
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textarea: {minHeight: 110},
  choiceWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  choice: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  choiceSelected: {backgroundColor: colors.ink, borderColor: colors.ink},
  choiceText: {color: colors.textMuted, fontSize: 12, fontWeight: '700'},
  choiceTextSelected: {color: colors.surface},
  twoColumns: {flexDirection: 'row', gap: 10},
  column: {flex: 1},
  switchRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    padding: 14,
  },
  switchTitle: {color: colors.text, fontSize: 14, fontWeight: '800'},
  switchHelp: {color: colors.textMuted, fontSize: 11, marginTop: 3},
  error: {color: '#A94343', fontSize: 12, lineHeight: 18, marginTop: 14},
  save: {alignItems: 'center', backgroundColor: colors.ink, borderRadius: 14, marginTop: 22, paddingVertical: 15},
  saveText: {color: colors.surface, fontSize: 15, fontWeight: '800'},
  delete: {
    alignItems: 'center',
    borderColor: '#B94747',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 14,
  },
  deleteText: {color: '#A94343', fontSize: 14, fontWeight: '800'},
});
