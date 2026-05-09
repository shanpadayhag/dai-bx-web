import { Injectable } from '@angular/core';
import { type IDBPDatabase, openDB } from 'idb';
import type { Group } from '@features/tasks/data-access/tasks.types';

const DB_NAME = 'daibx';
const DB_VERSION = 1;
const STORE_NAME = 'app-state';
const GROUPS_KEY = 'groups';

@Injectable({ providedIn: 'root' })
export class TasksRepository {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  async loadGroups(): Promise<Group[]> {
    try {
      const db = await this.db();
      const all = (await db.getAll(STORE_NAME)) as unknown[];
      const value = all[0];
      return Array.isArray(value) ? (value as Group[]) : [];
    } catch {
      return [];
    }
  }

  async saveGroups(groups: Group[]): Promise<void> {
    try {
      const db = await this.db();
      await db.put(STORE_NAME, groups, GROUPS_KEY);
    } catch {
      /* quota or unavailable storage — ignore */
    }
  }

  async close(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    db.close();
    this.dbPromise = null;
  }

  private db(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          db.createObjectStore(STORE_NAME);
        },
      });
    }
    return this.dbPromise;
  }
}
