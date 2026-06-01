/**
 * Parse-layer types for the "import a group from JSON" feature. These describe
 * the Claude-authored file shape and the result unions; none are persisted.
 * The domain `Group` / `Task` are produced from these by `build.ts`.
 */

/** A task node as it appears in the imported JSON. Recursive, arbitrary depth. */
export interface ImportedTask {
  name: string;
  tasks: ImportedTask[];
}

/** The root object of an imported file: one group plus its task tree. */
export interface ImportedGroup {
  name: string;
  tasks: ImportedTask[];
}

/** Result of parsing+validating raw file text. */
export type ParseResult =
  | { ok: true; group: ImportedGroup }
  | { ok: false; error: string }

/** Result of the end-to-end import action (parse → build → persist). */
export type ImportResult =
  | { ok: true; groupName: string; taskCount: number }
  | { ok: false; error: string }
