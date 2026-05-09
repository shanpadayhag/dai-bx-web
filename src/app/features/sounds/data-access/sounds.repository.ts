import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '@core/db/database.service';
import { STORES } from '@core/db/database.schema';
import type { SoundMeta, SoundRow } from '@features/sounds/data-access/sounds.types';

const toMeta = (row: SoundRow): SoundMeta => ({
  id: row.id,
  name: row.name,
  contentType: row.contentType,
  sizeBytes: row.sizeBytes,
  createdAt: row.createdAt,
});

@Injectable({ providedIn: 'root' })
export class SoundsRepository {
  private readonly database = inject(DatabaseService);

  async listMeta(): Promise<SoundMeta[]> {
    try {
      const db = await this.database.db();
      const rows = (await db.getAll(STORES.sounds)) as SoundRow[];
      rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return rows.map(toMeta);
    } catch {
      return [];
    }
  }

  async getBlob(id: string): Promise<Blob | null> {
    try {
      const db = await this.database.db();
      const row = (await db.get(STORES.sounds, id)) as SoundRow | undefined;
      return row?.blob ?? null;
    } catch {
      return null;
    }
  }

  async put(row: SoundRow): Promise<void> {
    try {
      const db = await this.database.db();
      await db.put(STORES.sounds, row);
    } catch {
      /* ignore */
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await this.database.db();
      await db.delete(STORES.sounds, id);
    } catch {
      /* ignore */
    }
  }
}
