import { Injectable } from '@angular/core';
import { type IDBPDatabase, openDB } from 'idb';
import { DB_NAME, DB_VERSION, upgradeDatabase } from '@core/db/database.schema';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  db(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
          upgradeDatabase(db, oldVersion);
        },
      });
    }
    return this.dbPromise;
  }

  async close(): Promise<void> {
    if (!this.dbPromise) return;
    try {
      const db = await this.dbPromise;
      db.close();
    } finally {
      this.dbPromise = null;
    }
  }
}
