export type OrganizerItemType = 'appointment' | 'medicine' | 'note' | 'reminder';

export type OrganizerRepeat = 'daily' | 'none' | 'weekly';

export type OrganizerItem = {
  active: boolean;
  completed: boolean;
  createdAt: string;
  details: string;
  dosage?: string;
  id: string;
  location?: string;
  repeat: OrganizerRepeat;
  scheduledAt?: string;
  title: string;
  type: OrganizerItemType;
  updatedAt: string;
};

export type OrganizerDraft = Omit<OrganizerItem, 'completed' | 'createdAt' | 'id' | 'updatedAt'>;

export const ORGANIZER_TYPE_LABELS: Record<OrganizerItemType, string> = {
  appointment: 'Appointment',
  medicine: 'Medicine',
  note: 'Note',
  reminder: 'Reminder',
};
