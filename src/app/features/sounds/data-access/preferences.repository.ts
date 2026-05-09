import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '@core/db/database.service';
import { PREFERENCES_KEY, STORES } from '@core/db/database.schema';
import type { PreferencesRow } from '@features/sounds/data-access/preferences.types';

const empty: PreferencesRow = { id: PREFERENCES_KEY, defaultSoundId: null };

@Injectable({ providedIn: 'root' })
export class PreferencesRepository {
  private readonly database = inject(DatabaseService);

  async load(): Promise<PreferencesRow> {
    try {
      const db = await this.database.db();
      const row = (await db.get(STORES.preferences, PREFERENCES_KEY)) as
        | PreferencesRow
        | undefined;
      return row ?? empty;
    } catch {
      return empty;
    }
  }

  async save(row: PreferencesRow): Promise<void> {
    try {
      const db = await this.database.db();
      await db.put(STORES.preferences, row);
    } catch {
      /* ignore */
    }
  }
}
