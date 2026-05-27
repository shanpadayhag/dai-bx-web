/**
 * Sound entities — ported 1:1 from client-web-old/.../sounds/data-access/sounds.types.ts.
 * `SoundMeta` is what the UI cares about; `SoundRow` is the IDB shape (meta + blob).
 */

export interface SoundMeta {
  id: string;
  name: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface SoundRow extends SoundMeta {
  blob: Blob;
}
