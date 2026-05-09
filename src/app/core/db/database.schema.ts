import type { IDBPDatabase } from 'idb';

export const DB_NAME = 'daibx_app';
export const DB_VERSION = 3;

export const STORES = {
  groups: 'groups',
  tasks: 'tasks',
  sounds: 'sounds',
  preferences: 'preferences',
} as const;

export const TASK_INDEXES = {
  byGroup: 'by-group',
} as const;

export const PREFERENCES_KEY = 'global';

export const upgradeDatabase = (db: IDBPDatabase, oldVersion: number): void => {
  if (oldVersion < 2) {
    if (!db.objectStoreNames.contains(STORES.groups)) {
      db.createObjectStore(STORES.groups, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(STORES.tasks)) {
      const tasks = db.createObjectStore(STORES.tasks, { keyPath: 'id' });
      tasks.createIndex(TASK_INDEXES.byGroup, 'groupId');
    }
  }
  if (oldVersion < 3) {
    if (!db.objectStoreNames.contains(STORES.sounds)) {
      db.createObjectStore(STORES.sounds, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(STORES.preferences)) {
      db.createObjectStore(STORES.preferences, { keyPath: 'id' });
    }
  }
};
