import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '@core/db/database.service';
import { STORES, TASK_INDEXES } from '@core/db/database.schema';
import type { GroupRow } from '@features/groups/data-access/groups.types';

@Injectable({ providedIn: 'root' })
export class GroupsRepository {
  private readonly database = inject(DatabaseService);

  async listAll(): Promise<GroupRow[]> {
    try {
      const db = await this.database.db();
      const rows = (await db.getAll(STORES.groups)) as GroupRow[];
      rows.sort((a, b) => a.order - b.order);
      return rows.map((row) => ({ ...row, isHidden: row.isHidden === true }));
    } catch {
      return [];
    }
  }

  async put(row: GroupRow): Promise<void> {
    try {
      const db = await this.database.db();
      await db.put(STORES.groups, row);
    } catch {
      /* ignore */
    }
  }

  async putBatch(rows: GroupRow[]): Promise<void> {
    if (rows.length === 0) return;
    try {
      const db = await this.database.db();
      const tx = db.transaction(STORES.groups, 'readwrite');
      for (const row of rows) await tx.store.put(row);
      await tx.done;
    } catch {
      /* ignore */
    }
  }

  async deleteCascade(groupId: string): Promise<void> {
    try {
      const db = await this.database.db();
      const tx = db.transaction([STORES.groups, STORES.tasks], 'readwrite');
      const taskKeys = (await tx
        .objectStore(STORES.tasks)
        .index(TASK_INDEXES.byGroup)
        .getAllKeys(groupId)) as string[];
      for (const key of taskKeys) await tx.objectStore(STORES.tasks).delete(key);
      await tx.objectStore(STORES.groups).delete(groupId);
      await tx.done;
    } catch {
      /* ignore */
    }
  }
}
