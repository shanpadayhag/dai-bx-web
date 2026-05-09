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
