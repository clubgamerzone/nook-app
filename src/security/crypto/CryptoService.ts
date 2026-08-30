import type {CiphertextEnvelope} from '../../features/chat/domain/models';

/**
 * Security boundary for the future native libsignal implementation.
 * Production code must never replace this with custom cryptography.
 */
export interface CryptoService {
  encryptText(conversationId: string, plaintext: string): Promise<CiphertextEnvelope>;
  decryptText(conversationId: string, envelope: CiphertextEnvelope): Promise<string>;
}
