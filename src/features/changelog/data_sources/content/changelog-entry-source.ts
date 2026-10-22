import { evaluate } from '@mdx-js/mdx';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ComponentType } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import ChangelogEntry from '@/features/changelog/entities/changelog-entry';

type ChangelogMetadata = Omit<ChangelogEntry, 'slug'>;

type CompiledChangelogEntry = {
  changelogEntry: ChangelogEntry;
  Content: ComponentType;
};

const isChangelogMetadata = (value: unknown): value is ChangelogMetadata => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return ['title', 'version', 'date', 'summary'].every((key) => typeof candidate[key] === 'string');
};

const findFileNames = async (): Promise<string[]> => {
  const fileNames = await readdir(path.join(process.cwd(), 'content', 'changelog'));
  return fileNames.filter((fileName) => fileName.endsWith('.mdx'));
};

const compileEntry = async (fileName: string): Promise<CompiledChangelogEntry> => {
  const source = await readFile(path.join(process.cwd(), 'content', 'changelog', fileName), 'utf8');
  const compiledModule = await evaluate(source, { ...jsxRuntime, baseUrl: import.meta.url });
  if (!isChangelogMetadata(compiledModule.metadata)) {
    throw new Error(`${fileName} must export metadata with title, version, date and summary`);
  }
  return {
    changelogEntry: { slug: fileName.replace(/\.mdx$/, ''), ...compiledModule.metadata },
    Content: compiledModule.default,
  };
};

const contentChangelogEntrySource = {
  findAll: async (): Promise<ChangelogEntry[]> => {
    const compiledEntries = await Promise.all((await findFileNames()).map(compileEntry));
    return compiledEntries
      .map((compiledEntry) => compiledEntry.changelogEntry)
      .sort((first, second) => second.date.localeCompare(first.date));
  },
  findBySlug: async (slug: string): Promise<CompiledChangelogEntry | null> => {
    const fileName = (await findFileNames()).find((candidate) => candidate === `${slug}.mdx`);
    return fileName ? compileEntry(fileName) : null;
  },
};

export type { CompiledChangelogEntry };
export default contentChangelogEntrySource;
