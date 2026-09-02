# Nook

Nook is a React Native organizer with a separately protected, invitation-only private messaging area for Android and iOS.

## Current beta

- Local Today, Agenda, reminders, medicine schedules, appointments, notes, repeats, and device alerts
- Firebase email/password accounts and private display names
- Settings-only Private Space with PIN, optional biometrics, background locking, and Android screenshot blocking
- One-time QR/code invitations and multiple one-to-one contacts
- Realtime text chat, seven-day default retention, paginated history, a 2,500-message server cap, whole-chat clearing, block/report/remove, and account deletion

The current text transport remains plaintext and visibly marked as development-only. It must not be used for sensitive conversations or marketed as end-to-end encrypted until the native libsignal adapter described in [release readiness](docs/RELEASE_READINESS.md) is complete and externally reviewed.

## Commands

```sh
npm install
npm start
npm run android
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

Android builds require JDK 17 and the configured Android SDK. Native iOS builds require macOS, Xcode, Bundler, and CocoaPods.

## Firebase

Native configuration targets Firebase project `nook-73e02`. Deploy the Firestore rules, indexes, and Cloud Functions before testing retention and safety controls. Firestore TTL uses the `messages` collection group's `expiresAt` field as declared in `firestore.indexes.json`.

## Release documents

- [Privacy policy draft](docs/PRIVACY_POLICY.md)
- [App Review notes](docs/APP_REVIEW_NOTES.md)
- [Release readiness and security gates](docs/RELEASE_READINESS.md)
- [Google Play Console submission guide](docs/GOOGLE_PLAY_CONSOLE.md)
- [Android internal testing and AAB guide](docs/ANDROID_INTERNAL_TESTING.md)
- [Project operations runbook](docs/OPERATIONS_RUNBOOK.md)
