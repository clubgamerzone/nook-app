# Nook integrated beta milestone

Nook began with the invitation-only private messaging vertical slice and now
uses the organizer-first information architecture from the product specification.

## Current implementation

- React Native 0.87 native iOS and Android projects
- Conversation list and one-to-one text conversation UI
- Realtime Firestore message transport for connected test users
- Conversation-wide disappearing messages: 24 hours, 3 days, 7 days, 30 days, or never
- Confirmed whole-chat clearing that removes messages for both people without removing the contact
- Local-first Today, Agenda, reminders, medicine schedules, appointments, and notes
- Device-local organizer alerts with daily and weekly repeat support
- Settings-only Private Space entry with local PIN, optional biometrics, retry delays, and background locking
- Neutral app-switcher cover and Android screenshot blocking in Private Space
- Block, report, remove-contact, and in-app account deletion flows
- Typed repository and cryptography boundaries
- Firebase email/password account gate
- Native Firebase Authentication and Firestore modules
- Required user-chosen display-name onboarding
- Short-lived, single-use invitation codes with identity review
- Atomic accepted-contact and conversation creation in Firestore
- Realtime accepted-contact list; no email, phone, or name discovery
- Development-only plaintext message persistence (not suitable for production)

The visible warning in the conversation screen is intentional. It must remain
until an audited native cryptography adapter is connected and verified on both
platforms.

## Architecture

```text
src/
  features/chat/
    components/       Shared chat UI
    data/             Repository interface and development adapter
    domain/           Message and conversation types
    hooks/            Presentation state
    screens/          Conversation list and thread
  features/contacts/  Invitation lifecycle and accepted contacts
  features/profile/   Private display-name onboarding
  security/crypto/    Native E2EE adapter boundary
  theme/              Shared visual tokens
```

`CryptoService` is a port, not an implementation. Production code must use an
audited protocol implementation through native Android/iOS bindings. Custom
cryptography and JavaScript-only placeholder encryption are out of scope.

## Required checks

```sh
npm run lint
npm test -- --runInBand
npx tsc --noEmit
```

## Local prerequisites

Android requires JDK 17, Android SDK Platform 35, Build Tools 36, and the SDK
`platform-tools` directory on `PATH`. Native iOS builds require macOS and Xcode.

The Android application ID and iOS bundle identifier are both
`com.clubgamerzone.nook`.

## Firebase

The native configurations target Firebase project `nook-73e02`. Email/password
authentication must be enabled in the Firebase console before account creation
will work. The checked-in Firestore rules permit only private profiles,
capability-style invitation reads, atomic contact acceptance, participant-only
conversation reads, and participant-only message reads and creates. The current
message body transport is plaintext solely to validate realtime behavior during
development. It must not be used for production or sensitive conversations.

Disappearing-message changes apply only to messages sent after the setting is
changed. Expired messages are hidden by the clients promptly. The `expiresAt`
field is declared as the Firestore TTL field so the server can permanently
remove them asynchronously once that policy is activated; `null` means that a
message never expires.

## Production security milestone

1. Create separate development and production Firebase projects.
2. Keep Firebase Authentication optional for the future local-only organizer.
3. Prove the native libsignal adapter on both platforms.
4. Store and synchronize only ciphertext message envelopes in Firestore.
5. Add encrypted voice transport only after the audited session layer is operational.
