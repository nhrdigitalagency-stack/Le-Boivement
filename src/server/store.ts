import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  createInitialSeed,
  DatabaseState,
  ROLE_PERMISSIONS,
} from '../data/seedData.ts';
import { sanityAdapter, SanityConnectionStatus } from './sanity.ts';

export { createInitialSeed, ROLE_PERMISSIONS };
export type { DatabaseState, SanityConnectionStatus };

const DATA_FILE_PATH = path.resolve(process.cwd(), '.boivement-runtime-db.json');

class TransactionalStore {
  private state: DatabaseState;
  private lockPromise: Promise<void> = Promise.resolve();

  constructor() {
    this.state = this.loadFromDisk();
    void this.initializeSanityCloudSync();
  }

  private ensureStateShape(data: DatabaseState): DatabaseState {
    const seed = createInitialSeed();
    if (!Array.isArray(data.reviews)) {
      data.reviews = seed.reviews;
    }
    return data;
  }

  private async initializeSanityCloudSync(): Promise<void> {
    try {
      const remote = await sanityAdapter.fetchRemoteState();
      if (remote && remote.settings && Array.isArray(remote.inventory)) {
        this.state = this.ensureStateShape(remote);
        this.recalculateAvailableStocks();
        this.saveToDisk(this.state);
      } else {
        await sanityAdapter.pushStateToSanity(this.state);
      }
    } catch (e) {
      console.error('Initial Sanity sync warning:', e);
    }
  }

  private loadFromDisk(): DatabaseState {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseState;
        if (parsed && parsed.settings && Array.isArray(parsed.inventory)) {
          return this.ensureStateShape(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load runtime DB file, using fresh seed:', e);
    }
    const seed = createInitialSeed();
    this.saveToDisk(seed);
    return seed;
  }

  private saveToDisk(data: DatabaseState = this.state): void {
    try {
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist runtime DB file:', e);
    }
  }

  public async runAtomic<T>(fn: (state: DatabaseState) => T | Promise<T>): Promise<T> {
    let releaseLock: () => void = () => {};
    const prevLock = this.lockPromise;
    this.lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    await prevLock;
    try {
      this.recalculateAvailableStocks();
      this.sweepExpiredReservationsSync();
      const result = await fn(this.state);
      this.recalculateAvailableStocks();
      this.saveToDisk(this.state);
      void sanityAdapter.pushStateToSanity(this.state);
      return result;
    } finally {
      releaseLock();
    }
  }

  public getSanityStatus(): SanityConnectionStatus {
    return sanityAdapter.getStatus();
  }

  public async syncWithSanityNow(): Promise<SanityConnectionStatus> {
    await sanityAdapter.pushStateToSanity(this.state);
    return sanityAdapter.getStatus();
  }

  public getStateReadOnly(): DatabaseState {
    this.recalculateAvailableStocks();
    return this.state;
  }

  public resetToDemoSeed(): DatabaseState {
    this.state = createInitialSeed();
    this.saveToDisk(this.state);
    void sanityAdapter.pushStateToSanity(this.state);
    return this.state;
  }

  public recalculateAvailableStocks(): void {
    for (const item of this.state.inventory) {
      if (item.reservedStock < 0) item.reservedStock = 0;
      if (item.physicalStock < 0) item.physicalStock = 0;
      item.availableStock = Math.max(0, item.physicalStock - item.reservedStock);
    }
  }

  public sweepExpiredReservationsSync(referenceNowMs: number = Date.now()): number {
    let expiredCount = 0;
    for (const res of this.state.stockReservations) {
      if (res.status !== 'active') continue;
      const expMs = new Date(res.expiresAt).getTime();
      if (expMs <= referenceNowMs) {
        const order = this.state.orders.find((o) => o.id === res.orderId);
        if (!order || (order.paymentStatus !== 'paid' && !order.stockDeducted)) {
          const inv = this.state.inventory.find((i) => i.id === res.inventoryItemId);
          if (inv) {
            inv.reservedStock = Math.max(0, inv.reservedStock - res.baseQuantity);
            inv.availableStock = Math.max(0, inv.physicalStock - inv.reservedStock);
            inv.updatedAt = new Date(referenceNowMs).toISOString();
          }
          res.status = 'expired';
          res.updatedAt = new Date(referenceNowMs).toISOString();
          expiredCount++;

          if (order && order.orderStatus === 'pending') {
            order.orderStatus = 'cancelled';
            order.updatedAt = new Date(referenceNowMs).toISOString();
          }
        }
      }
    }
    return expiredCount;
  }

  public addAuditLog(
    actor: { id: string; name: string; role: string },
    action: string,
    entityType: string,
    entityId: string,
    details: string
  ): void {
    this.state.auditLogs.unshift({
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    });
  }
}

export const store = new TransactionalStore();
