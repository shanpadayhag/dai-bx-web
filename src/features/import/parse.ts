/**
 * Pure parser/validator for imported group JSON. No Solid, no DB imports — it
 * takes raw text and returns a discriminated result with a specific, human
 * readable error on failure. Unknown/extra fields are ignored so a future
 * Claude prompt that adds keys won't break import.
 */

import type { ImportedGroup, ImportedTask, ParseResult } from './types'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

/** Thrown internally to unwind validation with a specific message. */
class ValidationError extends Error {}

/**
 * Validates a single task node and its descendants. `path` describes where we
 * are for error messages, e.g. "Task at position 3" or "Subtask at position 1
 * of \"Buy groceries\"".
 */
const validateTask = (value: unknown, path: string): ImportedTask => {
  if (!isObject(value)) {
    throw new ValidationError(`${path} must be an object.`)
  }
  if (!isNonEmptyString(value.name)) {
    throw new ValidationError(`${path} is missing a name.`)
  }
  const name = value.name.trim()
  const tasks = validateTaskArray(value.tasks, name, `tasks of "${name}"`)
  return { name, tasks }
}

/**
 * Validates an array of task nodes. Accepts `undefined` (treated as empty) only
 * at the nested level; the caller decides whether absence is allowed via
 * `allowMissing`.
 */
const validateTaskArray = (
  value: unknown,
  parentName: string,
  field: string,
): ImportedTask[] => {
  if (value === undefined) return []
  if (!Array.isArray(value)) {
    throw new ValidationError(`The ${field} must be an array.`)
  }
  return value.map((child, index) =>
    validateTask(child, `Subtask at position ${index + 1} of "${parentName}"`),
  )
}

export const parseGroupJson = (text: string): ParseResult => {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' }
  }

  try {
    if (!isObject(raw)) {
      throw new ValidationError('The file must contain a single group object.')
    }
    if (!isNonEmptyString(raw.name)) {
      throw new ValidationError('The group is missing a name.')
    }
    if (!Array.isArray(raw.tasks)) {
      throw new ValidationError('The group\'s tasks must be an array.')
    }
    const tasks = raw.tasks.map((child, index) =>
      validateTask(child, `Task at position ${index + 1}`),
    )
    const group: ImportedGroup = { name: raw.name.trim(), tasks }
    return { ok: true, group }
  } catch (err) {
    if (err instanceof ValidationError) return { ok: false, error: err.message }
    throw err
  }
}
