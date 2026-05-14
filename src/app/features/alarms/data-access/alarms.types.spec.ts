import { normalizeAlarm } from '@features/alarms/data-access/alarms.types';

describe('normalizeAlarm', () => {
  it('returns null for null input', () => {
    expect(normalizeAlarm(null)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(normalizeAlarm('alarm')).toBeNull();
    expect(normalizeAlarm(42)).toBeNull();
    expect(normalizeAlarm(undefined)).toBeNull();
  });

  it('returns null when firesAt is missing', () => {
    expect(normalizeAlarm({})).toBeNull();
    expect(normalizeAlarm({ soundId: 'x' })).toBeNull();
  });

  it('injects defaults for legacy { firesAt, soundId } shape', () => {
    const out = normalizeAlarm({ firesAt: '2026-05-14T09:00:00.000Z', soundId: null });
    expect(out).toEqual({
      firesAt: '2026-05-14T09:00:00.000Z',
      soundId: null,
      enabled: true,
      repeat: 'none',
    });
  });

  it('preserves explicit enabled and repeat values', () => {
    const out = normalizeAlarm({
      firesAt: '2026-05-14T09:00:00.000Z',
      soundId: 's1',
      enabled: false,
      repeat: 'daily',
    });
    expect(out).toEqual({
      firesAt: '2026-05-14T09:00:00.000Z',
      soundId: 's1',
      enabled: false,
      repeat: 'daily',
    });
  });

  it('coerces unknown repeat strings to "none"', () => {
    const out = normalizeAlarm({
      firesAt: '2026-05-14T09:00:00.000Z',
      repeat: 'weekly',
    });
    expect(out?.repeat).toBe('none');
  });

  it('defaults soundId to null when missing', () => {
    const out = normalizeAlarm({ firesAt: '2026-05-14T09:00:00.000Z' });
    expect(out?.soundId).toBeNull();
  });
});
