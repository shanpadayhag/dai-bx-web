import { Injectable, computed, inject, signal } from '@angular/core';
import { uid } from '@shared/utils/uid';
import { PreferencesRepository } from '@features/sounds/data-access/preferences.repository';
import type { PreferencesRow } from '@features/sounds/data-access/preferences.types';
import { SoundsRepository } from '@features/sounds/data-access/sounds.repository';
import type { SoundMeta } from '@features/sounds/data-access/sounds.types';

const stripExtension = (filename: string): string => {
  const dot = filename.lastIndexOf('.');
  return dot > 0 ? filename.slice(0, dot) : filename;
};

@Injectable({ providedIn: 'root' })
export class SoundsState {
  private readonly soundsRepo = inject(SoundsRepository);
  private readonly prefsRepo = inject(PreferencesRepository);

  private readonly _sounds = signal<SoundMeta[]>([]);
  private readonly _defaultSoundId = signal<string | null>(null);
  private readonly _isLoaded = signal(false);

  readonly sounds = this._sounds.asReadonly();
  readonly defaultSoundId = this._defaultSoundId.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();

  readonly hasSounds = computed(() => this._sounds().length > 0);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    const [sounds, prefs] = await Promise.all([this.soundsRepo.listMeta(), this.prefsRepo.load()]);
    this._sounds.set(sounds);
    this._defaultSoundId.set(prefs.defaultSoundId);
    this._isLoaded.set(true);
  }

  async addSound(file: File): Promise<SoundMeta | null> {
    const id = uid();
    const meta: SoundMeta = {
      id,
      name: stripExtension(file.name).trim() || 'Sound',
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      createdAt: new Date().toISOString(),
    };
    await this.soundsRepo.put({ ...meta, blob: file });
    this._sounds.update((rows) => [...rows, meta]);
    return meta;
  }

  async renameSound(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = this._sounds().find((s) => s.id === id);
    if (!existing || existing.name === trimmed) return;
    const blob = await this.soundsRepo.getBlob(id);
    if (!blob) return;
    const next: SoundMeta = { ...existing, name: trimmed };
    await this.soundsRepo.put({ ...next, blob });
    this._sounds.update((rows) => rows.map((s) => (s.id === id ? next : s)));
  }

  async removeSound(id: string): Promise<void> {
    await this.soundsRepo.delete(id);
    this._sounds.update((rows) => rows.filter((s) => s.id !== id));
    if (this._defaultSoundId() === id) {
      await this.setDefault(null);
    }
  }

  async setDefault(soundId: string | null): Promise<void> {
    const row: PreferencesRow = { id: 'global', defaultSoundId: soundId };
    await this.prefsRepo.save(row);
    this._defaultSoundId.set(soundId);
  }

  getBlob(id: string): Promise<Blob | null> {
    return this.soundsRepo.getBlob(id);
  }
}
