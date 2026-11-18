import { describe, expect, test } from 'vitest';
import { findBlockingAdvisories, type NpmAuditReport } from './dependency-audit.ts';

const today = new Date('2026-11-18T00:00:00Z');

const auditReport: NpmAuditReport = {
  vulnerabilities: {
    picomatch: {
      via: [
        {
          name: 'picomatch',
          severity: 'high',
          title: 'Slow glob matching',
          url: 'https://github.com/advisories/GHSA-aaaa-aaaa-aaaa',
        },
      ],
    },
    vite: { via: ['picomatch'] },
    next: {
      via: [
        {
          name: 'next',
          severity: 'moderate',
          title: 'Cache leak',
          url: 'https://github.com/advisories/GHSA-bbbb-bbbb-bbbb',
        },
      ],
    },
  },
};

const picomatchIgnore = {
  id: 'GHSA-aaaa-aaaa-aaaa',
  reason: 'Only reached by development tools',
  reviewBy: '2027-02-18',
};

describe('findBlockingAdvisories', () => {
  test('blocks advisories at or above the minimum severity', () => {
    const blockingAdvisories = findBlockingAdvisories(auditReport, 'moderate', [], today);

    expect(blockingAdvisories.map((advisory) => advisory.id)).toEqual([
      'GHSA-aaaa-aaaa-aaaa',
      'GHSA-bbbb-bbbb-bbbb',
    ]);
  });

  test('allows advisories below the minimum severity', () => {
    const blockingAdvisories = findBlockingAdvisories(auditReport, 'high', [], today);

    expect(blockingAdvisories.map((advisory) => advisory.id)).toEqual(['GHSA-aaaa-aaaa-aaaa']);
  });

  test('skips an ignored advisory until its review date has passed', () => {
    expect(findBlockingAdvisories(auditReport, 'high', [picomatchIgnore], today)).toEqual([]);
    expect(
      findBlockingAdvisories(
        auditReport,
        'high',
        [picomatchIgnore],
        new Date('2027-02-19T00:00:00Z'),
      ),
    ).toHaveLength(1);
  });

  test('refuses a report that holds no audit results', () => {
    expect(() => findBlockingAdvisories({}, 'high', [], today)).toThrow(
      'npm audit returned no results',
    );
  });
});
