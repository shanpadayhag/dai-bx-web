import { LegacyDataService } from '@core/db/legacy-data.service';

const LEGACY_DB_NAME = 'daibx';

const wipe = (): Promise<void> =>
  new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(LEGACY_DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });

const seed = (value: unknown): Promise<void> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(LEGACY_DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('app-state');
    };
    req.onerror = () => reject(req.error ?? new Error('open failed'));
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('app-state', 'readwrite');
      tx.objectStore('app-state').put(value, 'groups');
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('seed failed'));
      };
    };
  });

describe('LegacyDataService', () => {
  let service: LegacyDataService;

  beforeEach(async () => {
    await wipe();
    service = new LegacyDataService();
  });

  afterEach(async () => {
    await wipe();
  });

  it('returns null when the legacy database does not exist', async () => {
    expect(await service.load()).toBeNull();
  });

  it('returns null when the legacy database has no rows', async () => {
    await seed([]);
    expect(await service.load()).toBeNull();
  });

  it('returns the raw legacy array when present', async () => {
    await seed([{ id: 'g', name: 'Legacy', isOpen: true, tasks: [] }]);
    const loaded = await service.load();
    expect(loaded?.length).toBe(1);
    expect(loaded?.[0].name).toBe('Legacy');
  });

  it('clear deletes the legacy database entirely', async () => {
    await seed([{ id: 'g', name: 'Legacy', isOpen: true, tasks: [] }]);
    await service.clear();
    expect(await service.load()).toBeNull();
  });
});
