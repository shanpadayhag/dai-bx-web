import { Injectable } from '@angular/core';
import { openDB } from 'idb';

const LEGACY_DB_NAME = 'daibx';
const LEGACY_STORE = 'app-state';
const LEGACY_KEY = 'groups';

export interface LegacyGroupShape {
  id?: unknown;
  name?: unknown;
  order?: unknown;
  isOpen?: unknown;
  tasks?: unknown;
}

@Injectable({ providedIn: 'root' })
export class LegacyDataService {
  async load(): Promise<LegacyGroupShape[] | null> {
    try {
      if (!(await this.databaseExists())) return null;
      const db = await openDB(LEGACY_DB_NAME);
      try {
        if (!db.objectStoreNames.contains(LEGACY_STORE)) return null;
        const value = (await db.get(LEGACY_STORE, LEGACY_KEY)) as unknown;
        if (!Array.isArray(value) || value.length === 0) return null;
        return value as LegacyGroupShape[];
      } finally {
        db.close();
      }
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(LEGACY_DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  }

  private async databaseExists(): Promise<boolean> {
    try {
      const factory = indexedDB as IDBFactory & { databases?: () => Promise<IDBDatabaseInfo[]> };
      if (typeof factory.databases !== 'function') return true;
      const list = await factory.databases();
      return list.some((d) => d.name === LEGACY_DB_NAME);
    } catch {
      return true;
    }
  }
}
