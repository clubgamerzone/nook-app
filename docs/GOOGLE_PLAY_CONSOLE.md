# Google Play Console submission guide

Last verified: September 2, 2026

This document is the copy-and-paste reference for creating and preparing Nook in Google Play Console. It describes the current beta. Recheck every declaration whenever the app, SDKs, permissions, data handling, or target audience changes.

## App identity

| Play Console field | Value |
| --- | --- |
| App name | Nook |
| Default language | English (United States) — `en-US` |
| App or game | App |
| Free or paid | Free |
| Package name / Android application ID | `com.clubgamerzone.nook` |
| Category | Productivity |
| Target audience for the initial beta | Adults, 18 and over |
| Contains ads | No |
| News or magazine app | No |
| Government app | No |
| COVID-19 contact tracing/status app | No |

The package name becomes permanent in Google Play after the first artifact is uploaded. It is configured in `android/app/build.gradle` as both `namespace` and `applicationId`. The iOS bundle identifier is the same value in `ios/Nook.xcodeproj/project.pbxproj`.

Current Android configuration:

- Version name: `1.0`
- Version code: `1`
- Minimum Android API: 24
- Target Android API: 36

Target API 36 satisfies the Google Play requirement in effect from August 31, 2026 for new mobile apps.

## Main store listing — English (United States)

### App name

```text
Nook
```

### Short description

74 characters, below Google Play's 80-character limit:

```text
Plan your day and connect through invitation-only one-to-one conversations
```

### Full description

```text
Nook brings everyday planning and intentional one-to-one conversation into one calm app.

Organize your day

• See today's items and your upcoming agenda
• Create reminders, appointments, medicine schedules, and notes
• Repeat important items and mark them complete
• Receive optional reminders scheduled directly on your device
• Keep organizer information locally on your phone

Connect intentionally

• Start a one-to-one conversation with a one-time invitation code or QR code
• Connect only after an invitation is accepted
• Exchange real-time text messages with accepted contacts
• Choose a message retention period of 24 hours, 3 days, 7 days, or 30 days
• Clear an entire conversation when needed
• Block, report, or remove a contact from the conversation controls

A separate access area

The conversation area is reached through Settings and can be protected with a local PIN and optional device biometrics. It locks when Nook leaves the foreground. On Android, screenshots are blocked while that area is open.

Important beta notice

Nook's current messaging transport is not end-to-end encrypted. Do not use this beta for highly sensitive information. Organizer information remains on the device, while account, invitation, contact, report, and message information is processed using Firebase services as described in the privacy policy.

Nook does not contain advertising and does not sell personal data.
```

Do not advertise Nook as “encrypted,” “end-to-end encrypted,” “anonymous,” or “secure messaging” until the production encryption work and external security review in `docs/RELEASE_READINESS.md` are complete.

## Store contact details

Complete these with real, monitored information before submission:

| Field | Required value |
| --- | --- |
| Support email | **TODO: a monitored support address**, suggested format `support@clubgamerzone.com` |
| Website | **TODO: a working HTTPS page**, suggested URL `https://clubgamerzone.com/nook/` |
| Privacy policy | **TODO: publish the reviewed policy as HTML**, suggested URL `https://clubgamerzone.com/nook/privacy/` |
| External account-deletion page | **TODO: working request form or support path**, suggested URL `https://clubgamerzone.com/nook/delete-account/` |
| Developer/legal name and postal address | **TODO: enter the exact verified Play developer identity** |

The external deletion page is required even though Nook has an in-app deletion control. It must let a former user request account and associated-data deletion without reinstalling the app.

## Graphics

### Required assets

- Play Store icon: 512 × 512 px, 32-bit PNG with alpha, no more than 1,024 KB.
- Feature graphic: 1,024 × 500 px, JPEG or 24-bit PNG without alpha.
- Phone screenshots: at least 2; use 6–8 portrait screenshots for a useful listing. Each must be JPEG or 24-bit PNG without alpha, 320–3,840 px, with the long side no more than twice the short side.

The launcher icons under `android/app/src/main/res/mipmap-*` are not automatically uploaded to Play Console. Export the original Nook artwork separately at 512 × 512 for the listing.

### Recommended screenshot sequence

Use test data only—never expose a real email address, invitation code, contact, message, appointment, or medicine name.

1. Today view — caption: `Your day, at a glance`
2. Agenda — caption: `Plan reminders and appointments`
3. Create item — caption: `Notes, schedules, and repeating items`
4. Settings — caption: `Simple controls in one place`
5. Invitation QR/code — caption: `Connect by invitation`
6. Conversation list — caption: `One-to-one conversations`
7. Conversation — caption: `Choose how long messages remain`
8. Local access gate — caption: `PIN and optional biometric access`

Recommended feature-graphic direction: use Nook's warm visual style with a simple organizer/calendar composition. Keep important elements centered and avoid screenshots, device frames, pricing, rankings, store badges, or security claims.

## App content declarations

### App access

Answer that some functionality is restricted by sign-in and provide two permanent review accounts connected to each other. Do not use personal accounts. Keep the accounts active for every review.

Suggested reviewer instructions:

```text
Nook requires an email/password account. Sign in with the review credentials supplied above.

To review the organizer, use Today or Agenda from the bottom navigation.

To review one-to-one messaging:
1. Open Settings.
2. Under Security, open Privacy & access.
3. On first access, create any 4–8 digit local PIN; biometrics are optional.
4. The supplied review account is already connected to the second review account, so open that contact to inspect and send test messages.

The app locks and leaves this area when backgrounded. Android intentionally blocks screenshots while this area is open. The current beta messaging transport is not end-to-end encrypted.
```

### Ads

Select **No**. The current source has no advertising SDK.

### Target audience

For the initial closed beta, select only adult age groups (18+). Nook is not currently designed or reviewed for children. If teenagers are intentionally added later, reassess the Families, UGC, privacy, and safety requirements before changing this answer.

### Content rating / user interaction

Complete the IARC questionnaire truthfully for the uploaded build:

- The app enables direct user-to-user communication: **Yes**.
- It contains user-generated content in private one-to-one messages: **Yes**.
- Users can block and report other users: **Yes**.
- Purchases, gambling, simulated gambling, ads, violence, sexual content, drugs, or profanity supplied by the developer: **No**, for the current build.
- Do not claim messages are moderated automatically. Reports are stored for later review, and the production moderation/abuse workflow remains a release task.

The final rating is assigned by IARC; do not manually choose a rating.

### Health apps declaration

Select **Medication and Treatment Management** because Nook supports medicine schedules and medication reminders. Explain:

```text
Nook lets a user manually create a medicine name, schedule, and on-device reminder. This information is stored locally on the user's device. Nook does not diagnose conditions, recommend treatment or dosage, connect to Health Connect, access medical records, or transmit organizer/medicine entries to the developer's servers.
```

The privacy policy must mention this limited health-related feature and state that it is not medical advice or an emergency service.

### Other declarations

- Financial features: none.
- Government affiliation: none.
- News and magazine: no.
- Ads: no.
- Sensitive permissions: the current manifest uses Internet and notification permission only. It does not request contacts, location, camera, microphone, SMS, call log, broad photo/media, or Health Connect permissions.
- Notification permission is used only for organizer reminders scheduled on the device.

## Data safety draft

This is a working answer set for the current code and must be checked again after the final `.aab` and SDK dependency report are available.

### Top-level answers

- Does the app collect or share required user data types? **Yes, collects data.**
- Is data shared with third parties? **No**, treating Firebase as a contracted service provider rather than a third-party sharing purpose. Confirm this against the final legal/privacy configuration.
- Is all collected data encrypted in transit? **Yes**, Firebase SDK traffic uses HTTPS/TLS.
- Can users request deletion? **Yes**, but do not submit until the external deletion URL is live and the deletion implementation removes all associated cloud data.

### Data types to declare

| Play data type | Collected | Required or optional | Purposes |
| --- | --- | --- | --- |
| Personal info → Name | Yes; display name | Required for an account/profile | App functionality; account management |
| Personal info → Email address | Yes | Required for authentication | App functionality; account management; security/fraud prevention |
| App info and performance / device metadata, where the Firebase questionnaire maps its automatically collected user-agent information | Recheck final SDK form | Automatic | App functionality; security/fraud prevention; developer communications only if applicable |
| Device or other IDs → User ID | Yes; Firebase UID | Automatic/required | App functionality; account management; security/fraud prevention |
| Messages → Other in-app messages | Yes; message body and delivery metadata | Optional—the user chooses messaging | App functionality |
| App activity → Other user-generated content | Yes; invitations, reports, and relationship state if requested by the form | Optional | App functionality; security/fraud prevention |

Important exclusions for the current build:

- Do not select device contacts; Nook never reads the address book.
- Do not select precise or approximate location. A location typed into a local appointment stays on the device.
- Do not declare organizer notes or medicine schedules as collected because they currently stay on-device.
- Do not claim that cloud messages are end-to-end encrypted. They are encrypted in transit but currently stored as readable text in Firestore.
- Firebase Authentication also processes password credentials, IP addresses, and user-agent information for authentication and abuse prevention. Reconcile the final answers with Firebase's current Play data-disclosure guide.

## Account deletion and privacy blockers

The current in-app deletion implementation deletes the user's profile document, that user's contact subcollection, local organizer data, local PIN material, and Firebase Authentication account. It does not yet prove removal of every invitation, conversation/message, reciprocal contact, or retained report associated with the user.

Before production submission:

1. Complete server-side cascading deletion and document any legally retained anti-abuse reports.
2. Publish the privacy policy at a stable HTTPS HTML URL and link it inside the app.
3. Publish an external account-deletion request page.
4. Replace all TODO legal/support details in the privacy policy.
5. Deploy and verify Firestore security rules, retention cleanup, and abuse controls.

## Release artifact and signing

Google Play expects an Android App Bundle (`.aab`), not the shareable APK.

The current `release` build incorrectly uses `android/app/debug.keystore`. **Never upload that build as the permanent production release.** Create a private upload key, store it outside Git, configure release signing through uncommitted/local Gradle properties or secure CI secrets, and opt into Google Play App Signing.

After production signing is configured:

```powershell
Set-Location android
.\gradlew.bat clean bundleRelease
```

Expected output:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Before uploading, run tests, inspect the signed bundle, confirm `versionCode` is unique, and archive the upload key and passwords in a proper password manager. Every subsequent Play upload needs a higher `versionCode`.

## Testing and rollout

Start with Internal testing, then Closed testing. If the Play developer account is a personal account created after November 13, 2023, Google currently requires at least 12 testers to remain opted into a closed test continuously for 14 days before applying for production access.

Do not promote the current beta to production until every blocker in `docs/RELEASE_READINESS.md` is closed. A closed testing listing must still use accurate privacy, data safety, health, access, and content declarations.

## Official references

- Store listing limits and creation: https://support.google.com/googleplay/android-developer/answer/9859152
- Graphic asset requirements: https://support.google.com/googleplay/android-developer/answer/9866151
- App review declarations: https://support.google.com/googleplay/android-developer/answer/9859455
- Target API requirements: https://support.google.com/googleplay/android-developer/answer/11926878
- Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
- Health apps declaration: https://support.google.com/googleplay/android-developer/answer/14738291
- Firebase Android Play disclosure: https://firebase.google.com/docs/android/play-data-disclosure
- New personal-account testing: https://support.google.com/googleplay/android-developer/answer/14151465

