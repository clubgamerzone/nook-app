# Nook operations runbook

Last updated: September 2, 2026

Use this document to find project configuration, features, build commands, and cloud operations performed during development. Update it whenever these areas change.

## Repository and identifiers

- GitHub: `https://github.com/clubgamerzone/nook-app`
- Android application ID: `com.clubgamerzone.nook`
  - `android/app/build.gradle` → `namespace` and `defaultConfig.applicationId`
- iOS bundle identifier: `com.clubgamerzone.nook`
  - `ios/Nook.xcodeproj/project.pbxproj` → `PRODUCT_BUNDLE_IDENTIFIER`
- Android app label: `android/app/src/main/res/values/strings.xml`
- Firebase project: `nook-73e02`
  - local project alias: `.firebaserc`
  - Android native config: `android/app/google-services.json`
  - iOS native config: `ios/GoogleService-Info.plist`

## Feature map

- Authentication: `src/features/auth/`
- Profile/display-name onboarding: `src/features/profile/`
- Organizer, settings, and local reminders: `src/features/organizer/`
- Private Space PIN/biometric gate: `src/features/privateSpace/`
- Invitation, QR, contacts, report, and block flows: `src/features/contacts/`
- Conversations and Firestore chat transport: `src/features/chat/`
- Account deletion orchestration: `src/services/account/AccountDeletionService.ts`
- Firestore authorization: `firestore.rules`
- Firestore TTL/index configuration: `firestore.indexes.json`
- Server-side message cap and deletion bookkeeping: `functions/src/index.ts`
- Existing-data retention migration: `functions/scripts/migrate-message-retention.js`

Detailed milestone notes are in `docs/CHAT_MILESTONE.md`; production gates are in `docs/RELEASE_READINESS.md`.

## Local setup and verification

```powershell
npm install
npm start
npm run android
npx tsc --noEmit
npm run lint
npm test -- --runInBand
npm run test:rules
```

Android requires JDK 17 and the Android SDK. iOS compilation requires macOS and Xcode.

### Android APK for direct installation

```powershell
Set-Location android
.\gradlew.bat assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

The current release configuration still uses the debug keystore. It is suitable only for local beta installation, not as the permanent Google Play signing configuration.

### Google Play AAB

After a private upload key is configured:

```powershell
Set-Location android
.\gradlew.bat clean bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## Firebase access and deployment

Firebase was accessed locally with Firebase CLI and in the Google Cloud Console for project `nook-73e02`.

Read-only/local validation:

```powershell
npx firebase-tools projects:list
npm run test:rules
npx firebase-tools emulators:start --only functions
```

Intended deployment command:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes,functions --project nook-73e02
```

Existing conversation migration:

```powershell
$env:GOOGLE_CLOUD_PROJECT = "nook-73e02"
node functions/scripts/migrate-message-retention.js
Remove-Item Env:GOOGLE_CLOUD_PROJECT
```

Cloud Console TTL path:

```text
Google Cloud Console → Firestore → Time-to-live (TTL)
Collection group: messages
Timestamp field: expiresAt
Expiration offset: 0 seconds
```

On August 30, 2026, creation of that policy returned: `403: Project nook-73e02 has billing disabled.` Firestore TTL deletes and Cloud Functions require billing to be enabled. Do not install/distribute a client that depends on the new retention rules until the migration, rules, functions, and TTL policy are deployed and verified together.

Do not commit service-account keys, upload keystores, passwords, or cloud credentials. Firebase native app configuration files contain project configuration but must still be reviewed before public distribution.

## Google Play preparation

All copy, declarations, asset specifications, reviewer instructions, and signing warnings are maintained in `docs/GOOGLE_PLAY_CONSOLE.md`.

