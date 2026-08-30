# Nook Privacy Policy — Beta Draft

Last updated: August 30, 2026

Nook is a personal organizer with a separately protected, invitation-only messaging area called Private Space. This draft describes the current beta and must be reviewed by counsel and published at a stable public URL before store submission.

## Data Nook handles

- Account data: email address, Firebase account identifier, display name, and account timestamps.
- Connection data: invitation status, accepted contacts, conversation participants, block state, and related timestamps.
- Messages: the current beta stores text message bodies and delivery metadata in Cloud Firestore. **Text messages are not yet end-to-end encrypted. Do not use the beta for sensitive conversations.**
- Organizer data: reminders, medicine schedules, appointments, and notes are stored locally on the device. They are not uploaded by the current beta.
- Reports: when a user reports a contact, Nook stores the reporter, reported account, conversation reference, selected reason, and timestamp. Message text is not automatically attached.
- Device security data: the Private Space PIN is never stored or transmitted. A salt and memory-hard verifier are stored locally. Biometric data remains with the operating system.

## Why data is used

Nook uses account and connection data to authenticate users, process invitations, synchronize approved one-to-one conversations, enforce blocking, investigate reports, and support account deletion. Local organizer data is used only to show items and schedule device alerts.

## Sharing and service providers

The beta uses Google Firebase Authentication and Cloud Firestore. Firebase processes account, connection, message, and report data to provide those services. Nook does not sell personal data or use message content for advertising.

## Retention and deletion

Users can clear a conversation for both participants, select a disappearing-message period, remove contacts, clear local organizer data, and delete their account in the app. Expired message documents can remain in Firebase briefly until the configured TTL service removes them. Safety reports may be retained to prevent abuse and meet legal obligations.

## Notifications

Organizer alerts are scheduled locally on the device. The beta does not send chat push notifications.

## Security limitations

Private Space uses a local PIN, optional operating-system biometrics, background locking, a neutral app-switcher cover, and Android secure-window protection. These controls cannot protect content on a fully compromised device or prevent someone from photographing a screen with another camera. Production end-to-end encryption and encrypted voice messages are not enabled in this beta.

## Children, changes, and contact

Nook is not intended for children under 13. This policy may change as the beta evolves; material changes will update the date above. Before public release, replace this paragraph with the developer’s legal name, postal address, privacy email, and jurisdiction-specific contact details.
