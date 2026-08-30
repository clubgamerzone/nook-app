# Nook chat-first milestone

Nook development starts with the invitation-only private messaging vertical
slice. Organizer functionality will be added after the messaging architecture
has been validated.

## Current implementation

- React Native 0.87 native iOS and Android projects
- Conversation list and one-to-one text conversation UI
- Development-only in-memory repository
- Typed repository and cryptography boundaries
- No production encryption, persistence, authentication, or network transport yet

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

## Next milestone

1. Create separate development and production Firebase projects.
2. Add Firebase Authentication without requiring an account for the future local organizer.
3. Implement one-time invitations and accepted-contact authorization.
4. Prove the native libsignal adapter on both platforms.
5. Store only ciphertext envelopes in Firestore.
