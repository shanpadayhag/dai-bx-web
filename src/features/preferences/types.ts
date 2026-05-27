/**
 * Global preferences — ported 1:1 from client-web-old/.../sounds/data-access/preferences.types.ts.
 * Single record at IDB key `"global"`.
 */

export interface PreferencesRow {
  id: 'global';
  defaultSoundId: string | null;
}
