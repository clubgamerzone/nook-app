import AsyncStorage from '@react-native-async-storage/async-storage';
import {scryptAsync} from '@noble/hashes/scrypt.js';
import {bytesToHex, randomBytes, utf8ToBytes} from '@noble/hashes/utils.js';
import * as Keychain from 'react-native-keychain';
import 'react-native-get-random-values';

export type PrivateLockConfiguration = {
  biometricEnabled: boolean;
  cost?: number;
  salt: string;
  verifier: string;
};

const CURRENT_SCRYPT_COST = 16384;

function configurationKey(uid: string) {
  return `@nook:private-lock:${uid}`;
}

function biometricService(uid: string) {
  return `com.clubgamerzone.nook.private-space.${uid}`;
}

function attemptKey(uid: string) {
  return `@nook:private-lock-attempts:${uid}`;
}

function secureEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference += Math.abs(left.charCodeAt(index) - right.charCodeAt(index));
  }
  return difference === 0;
}

async function derive(pin: string, salt: string, cost: number) {
  return bytesToHex(
    await scryptAsync(utf8ToBytes(pin), utf8ToBytes(salt), {N: cost, dkLen: 32, p: 1, r: 8}),
  );
}

export class PrivateLockService {
  async load(uid: string): Promise<PrivateLockConfiguration | null> {
    const value = await AsyncStorage.getItem(configurationKey(uid));
    if (!value) {
      return null;
    }
    try {
      const configuration = JSON.parse(value) as PrivateLockConfiguration;
      return configuration.salt && configuration.verifier ? configuration : null;
    } catch {
      return null;
    }
  }

  async create(uid: string, pin: string, biometricEnabled: boolean) {
    const salt = bytesToHex(randomBytes(24));
    const configuration: PrivateLockConfiguration = {
      biometricEnabled,
      cost: CURRENT_SCRYPT_COST,
      salt,
      verifier: await derive(pin, salt, CURRENT_SCRYPT_COST),
    };
    if (biometricEnabled) {
      await this.enableBiometrics(uid);
    }
    await AsyncStorage.setItem(configurationKey(uid), JSON.stringify(configuration));
    return configuration;
  }

  async verify(pin: string, configuration: PrivateLockConfiguration) {
    return secureEqual(
      await derive(pin, configuration.salt, configuration.cost ?? 32768),
      configuration.verifier,
    );
  }

  async loadAttemptState(uid: string) {
    const serialized = await AsyncStorage.getItem(attemptKey(uid));
    if (!serialized) {
      return {blockedUntil: 0, failures: 0};
    }
    try {
      const value = JSON.parse(serialized) as {blockedUntil: number; failures: number};
      return {
        blockedUntil: Number(value.blockedUntil) || 0,
        failures: Number(value.failures) || 0,
      };
    } catch {
      return {blockedUntil: 0, failures: 0};
    }
  }

  async recordFailure(uid: string, currentFailures: number) {
    const failures = currentFailures + 1;
    const delay = failures >= 3 ? Math.min(30, 2 ** (failures - 2)) : 0;
    const state = {blockedUntil: Date.now() + delay * 1000, failures};
    await AsyncStorage.setItem(attemptKey(uid), JSON.stringify(state));
    return {...state, delay};
  }

  async clearFailures(uid: string) {
    await AsyncStorage.removeItem(attemptKey(uid));
  }

  async supportedBiometry() {
    return Keychain.getSupportedBiometryType();
  }

  async enableBiometrics(uid: string) {
    await Keychain.setGenericPassword('nook-private-space', bytesToHex(randomBytes(32)), {
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      service: biometricService(uid),
    });
  }

  async unlockWithBiometrics(uid: string) {
    const credential = await Keychain.getGenericPassword({
      authenticationPrompt: {title: 'Verify Nook access'},
      service: biometricService(uid),
    });
    return Boolean(credential);
  }

  async reset(uid: string) {
    await AsyncStorage.removeItem(configurationKey(uid));
    await AsyncStorage.removeItem(attemptKey(uid));
    await Keychain.resetGenericPassword({service: biometricService(uid)});
  }
}
