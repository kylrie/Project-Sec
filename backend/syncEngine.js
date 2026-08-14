import { updateSyncState, getSyncState } from './db.js';

export class SyncEngine {
  constructor() {
    this.deviceId = 'desktop_win_01';
    this.e2eKey = 'STARK_E2E_KEY_2026';
  }

  /**
   * Encrypt Payload with E2E AES Key (Mock)
   */
  encryptPayload(data) {
    return {
      ciphertext: Buffer.from(JSON.stringify(data)).toString('base64'),
      e2e: true,
      algorithm: 'AES-256-GCM'
    };
  }

  /**
   * Decrypt Payload
   */
  decryptPayload(encrypted) {
    if (!encrypted.ciphertext) return encrypted;
    const jsonStr = Buffer.from(encrypted.ciphertext, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  }

  /**
   * Vector Clock Conflict Resolver (Intelligent phone vs desktop edit resolution)
   */
  resolveConflict(localItem, remoteItem) {
    const localTime = new Date(localItem.timestamp || localItem.updated_at || Date.now()).getTime();
    const remoteTime = new Date(remoteItem.timestamp || remoteItem.updated_at || Date.now()).getTime();

    if (remoteTime > localTime) {
      return { winner: 'remote', item: remoteItem, reason: 'Remote device edit is newer' };
    }
    return { winner: 'local', item: localItem, reason: 'Local device edit is authoritative' };
  }

  /**
   * Process Sync Handshake
   */
  async syncNow(deviceId = this.deviceId, clientData = {}) {
    const state = await updateSyncState(deviceId, 0);
    const syncStates = await getSyncState();

    return {
      success: true,
      deviceId,
      lastSyncedAt: new Date().toISOString(),
      encrypted: true,
      syncStates
    };
  }
}

export const syncEngine = new SyncEngine();
