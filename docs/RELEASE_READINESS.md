# Nook release readiness

## Implemented beta scope

- Email/password authentication and display-name onboarding
- Local-first Today, Agenda, reminders, medicine schedules, appointments, and notes
- Create, edit, complete, repeat, activate/deactivate, and delete organizer items
- Device-local organizer notifications
- Settings-only Private Space entry
- Memory-hard local PIN verifier, increasing retry delays, and optional OS biometrics
- Immediate background lock, neutral app-switcher cover, and Android secure-window screenshot blocking
- Invitation-only contacts, QR/code invitations, realtime one-to-one text, retention choices, and whole-chat clearing
- Contact block, report, removal, and in-app account deletion
- Firestore participant and relationship authorization rules

## Production blockers

1. Build a maintained React Native bridge over the official libsignal Java and Swift APIs; implement identity/prekey/session persistence and key verification.
2. Migrate message documents from plaintext `body` to versioned ciphertext envelopes and complete a compatibility migration.
3. Add encrypted voice recording/upload/playback only after the messaging key/session layer exists.
4. Conduct external cryptographic and threat-model review before making E2EE claims.
5. Activate Firestore TTL in the project account, deploy the latest rules, enable App Check, and add server-side invitation/report abuse controls.
6. Configure a private Android release keystore, build/test iOS on macOS, publish the privacy-policy URL, supply legal contact details, and complete store encryption/export declarations.
7. Resolve the current high-severity React Native/Metro dependency advisories through a tested upstream framework update; do not use a forced audit downgrade as a release shortcut.

The official Signal library provides Java and Swift APIs but no supported React Native bridge. An unofficial JavaScript Signal implementation is intentionally not used as a shortcut.
