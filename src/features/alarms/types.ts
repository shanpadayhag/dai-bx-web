/**
 * Alarm spec embedded on a Task. Ported 1:1 from
 * client-web-old/.../alarms/data-access/alarms.types.ts, including the
 * defensive `normalizeAlarm` that filters out invalid persisted alarm rows.
 */

export type AlarmRepeat = 'none' | 'daily'

export interface AlarmSpec {
  firesAt: string;
  soundId: string | null;
  enabled: boolean;
  repeat: AlarmRepeat;
}

export const normalizeAlarm = (raw: unknown): AlarmSpec | null => {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as {
    firesAt?: unknown
    soundId?: unknown
    enabled?: unknown
    repeat?: unknown
  }
  if (typeof r.firesAt !== 'string') return null
  const soundId = typeof r.soundId === 'string' ? r.soundId : null
  const enabled = typeof r.enabled === 'boolean' ? r.enabled : true
  const repeat: AlarmRepeat = r.repeat === 'daily' ? 'daily' : 'none'
  return { firesAt: r.firesAt, soundId, enabled, repeat }
}
