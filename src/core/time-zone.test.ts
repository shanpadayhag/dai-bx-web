import { describe, expect, test } from 'vitest';
import {
  formatClockInZone,
  timeZoneLabel,
  timeZoneNames,
  timeZonePlaceName,
} from '@/core/time-zone';

describe('timeZoneLabel', () => {
  test('names the zone with its offset at that moment', () => {
    expect(timeZoneLabel('Asia/Manila', new Date('2026-11-09T10:00:00Z'))).toBe(
      'Asia/Manila (GMT+8)',
    );
  });

  test('follows daylight saving in zones that have it', () => {
    expect(timeZoneLabel('Europe/London', new Date('2026-01-15T12:00:00Z'))).toBe(
      'Europe/London (GMT)',
    );
    expect(timeZoneLabel('Europe/London', new Date('2026-07-15T12:00:00Z'))).toBe(
      'Europe/London (GMT+1)',
    );
  });

  test('writes underscores in zone names as spaces', () => {
    expect(timeZoneLabel('America/Los_Angeles', new Date('2026-07-15T12:00:00Z'))).toBe(
      'America/Los Angeles (GMT-7)',
    );
  });
});

describe('timeZoneNames', () => {
  test('lists the IANA zones with UTC first and the given zone kept', () => {
    const listedZoneNames = timeZoneNames('Asia/Manila');
    expect(listedZoneNames[0]).toBe('UTC');
    expect(listedZoneNames).toContain('Asia/Manila');
    expect(listedZoneNames).toContain('Europe/London');
    expect(new Set(listedZoneNames).size).toBe(listedZoneNames.length);
  });
});

describe('formatClockInZone', () => {
  test('shows the 24-hour wall-clock time in that zone', () => {
    const tenUtc = new Date('2026-11-09T10:00:00Z');
    expect(formatClockInZone(tenUtc, 'Asia/Manila')).toBe('18:00');
    expect(formatClockInZone(tenUtc, 'Europe/London')).toBe('10:00');
    expect(formatClockInZone(new Date('2026-11-09T16:30:00Z'), 'Asia/Manila')).toBe('00:30');
  });
});

describe('timeZonePlaceName', () => {
  test('names a zone by its place', () => {
    expect(timeZonePlaceName('Europe/London')).toBe('London');
    expect(timeZonePlaceName('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
    expect(timeZonePlaceName('UTC')).toBe('UTC');
  });
});
