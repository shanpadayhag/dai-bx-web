import type { IDBPDatabase } from 'idb';

export const DB_NAME = 'daibx_app';
export const DB_VERSION = 2;

export const STORES = {
  groups: 'groups',
  tasks: 'tasks',
} as const;

export const TASK_INDEXES = {
  byGroup: 'by-group',
} as const;

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
};
