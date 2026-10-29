import { render } from '@testing-library/react';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { createElement } from 'react';
import { describe, expect, test } from 'vitest';
import contentChangelogEntrySource from '@/features/changelog/data_sources/content/changelog-entry-source';

describe('contentChangelogEntrySource', () => {
  test('lists one entry per MDX file, newest first', async () => {
    const fileNames = await readdir(path.join(process.cwd(), 'content', 'changelog'));
    const changelogEntries = await contentChangelogEntrySource.findAll();

    expect(changelogEntries).toHaveLength(fileNames.filter((fileName) => fileName.endsWith('.mdx')).length);
    const entryDates = changelogEntries.map((changelogEntry) => changelogEntry.date);
    expect(entryDates).toEqual([...entryDates].sort().reverse());
  });

  test('takes each slug from its file name and every date as YYYY-MM-DD', async () => {
    const changelogEntries = await contentChangelogEntrySource.findAll();

    for (const changelogEntry of changelogEntries) {
      expect(changelogEntry.slug.startsWith(changelogEntry.date)).toBe(true);
      expect(changelogEntry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test('compiles an entry body that renders as markup', async () => {
    const compiledEntry = await contentChangelogEntrySource.findBySlug('2026-10-29-daibx-3');

    expect(compiledEntry?.changelogEntry.version).toBe('v3.0.0');
    const { container } = render(createElement(compiledEntry!.Content));
    expect(container.querySelector('h2')).not.toBeNull();
  });

  test('returns null for a slug with no file', async () => {
    expect(await contentChangelogEntrySource.findBySlug('2099-01-01-missing')).toBeNull();
  });
});
