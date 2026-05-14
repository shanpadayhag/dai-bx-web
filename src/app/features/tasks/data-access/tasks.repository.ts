import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '@core/db/database.service';
import { STORES, TASK_INDEXES } from '@core/db/database.schema';
import { normalizeAlarm } from '@features/alarms/data-access/alarms.types';
import type { TaskRow } from '@features/tasks/data-access/tasks.types';

const hydrateRow = (row: TaskRow): TaskRow => ({
  ...row,
  alarm: normalizeAlarm(row.alarm),
});

@Injectable({ providedIn: 'root' })
export class TasksRepository {
  private readonly database = inject(DatabaseService);

  async listAll(): Promise<TaskRow[]> {
    try {
      const db = await this.database.db();
      const rows = (await db.getAll(STORES.tasks)) as TaskRow[];
      return rows.map(hydrateRow);
    } catch {
      return [];
    }
  }

  async listByGroup(groupId: string): Promise<TaskRow[]> {
    try {
      const db = await this.database.db();
      const rows = (await db.getAllFromIndex(
        STORES.tasks,
        TASK_INDEXES.byGroup,
        groupId,
      )) as TaskRow[];
      return rows.map(hydrateRow);
    } catch {
      return [];
    }
  }

  async put(row: TaskRow): Promise<void> {
    try {
      const db = await this.database.db();
      await db.put(STORES.tasks, row);
    } catch {
      /* ignore */
    }
  }

  async putBatch(rows: TaskRow[]): Promise<void> {
    if (rows.length === 0) return;
    try {
      const db = await this.database.db();
      const tx = db.transaction(STORES.tasks, 'readwrite');
      for (const row of rows) await tx.store.put(row);
      await tx.done;
    } catch {
      /* ignore */
    }
  }

  async deleteByIds(taskIds: string[]): Promise<void> {
    if (taskIds.length === 0) return;
    try {
      const db = await this.database.db();
      const tx = db.transaction(STORES.tasks, 'readwrite');
      for (const id of taskIds) await tx.store.delete(id);
      await tx.done;
    } catch {
      /* ignore */
    }
  }
}
