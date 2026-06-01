import { describe, it, expect } from 'vitest'
import { parseGroupJson } from './parse'

const ok = (text: string) => {
  const result = parseGroupJson(text)
  if (!result.ok) throw new Error(`expected ok, got error: ${result.error}`)
  return result.group
}

const fail = (text: string) => {
  const result = parseGroupJson(text)
  if (result.ok) throw new Error('expected failure, got ok')
  return result.error
}

describe('parseGroupJson — invalid input', () => {
  it('rejects non-JSON text', () => {
    expect(fail('not json {')).toMatch(/not valid json/i)
  })

  it('rejects a non-object root (array)', () => {
    expect(fail('[]')).toMatch(/single group object/i)
  })

  it('rejects a non-object root (string)', () => {
    expect(fail('"hello"')).toMatch(/single group object/i)
  })

  it('rejects a missing group name', () => {
    expect(fail(JSON.stringify({ tasks: [] }))).toMatch(/group is missing a name/i)
  })

  it('rejects a blank group name', () => {
    expect(fail(JSON.stringify({ name: '   ', tasks: [] }))).toMatch(
      /group is missing a name/i,
    )
  })

  it('rejects tasks that are not an array', () => {
    expect(fail(JSON.stringify({ name: 'G', tasks: {} }))).toMatch(
      /tasks must be an array/i,
    )
  })

  it('names the position of a top-level task missing its name', () => {
    const text = JSON.stringify({
      name: 'G',
      tasks: [{ name: 'A' }, { name: 'B' }, {}],
    })
    expect(fail(text)).toBe('Task at position 3 is missing a name.')
  })

  it('names the path of a nested subtask missing its name', () => {
    const text = JSON.stringify({
      name: 'G',
      tasks: [{ name: 'Buy groceries', tasks: [{ name: 'Milk' }, {}] }],
    })
    expect(fail(text)).toBe(
      'Subtask at position 2 of "Buy groceries" is missing a name.',
    )
  })

  it('rejects a nested tasks field that is not an array', () => {
    const text = JSON.stringify({
      name: 'G',
      tasks: [{ name: 'A', tasks: 'nope' }],
    })
    expect(fail(text)).toMatch(/tasks of "A" must be an array/i)
  })
})

describe('parseGroupJson — valid input', () => {
  it('accepts a group with an empty tasks array', () => {
    const group = ok(JSON.stringify({ name: 'Errands', tasks: [] }))
    expect(group).toEqual({ name: 'Errands', tasks: [] })
  })

  it('trims the group name', () => {
    expect(ok(JSON.stringify({ name: '  Errands  ', tasks: [] })).name).toBe(
      'Errands',
    )
  })

  it('defaults a missing nested tasks field to an empty array', () => {
    const group = ok(JSON.stringify({ name: 'G', tasks: [{ name: 'A' }] }))
    expect(group.tasks[0]).toEqual({ name: 'A', tasks: [] })
  })

  it('preserves nesting to arbitrary depth', () => {
    const text = JSON.stringify({
      name: 'G',
      tasks: [
        {
          name: 'Buy groceries',
          tasks: [{ name: 'Milk' }, { name: 'Eggs' }],
        },
        { name: 'Call the bank' },
      ],
    })
    const group = ok(text)
    expect(group.tasks).toHaveLength(2)
    expect(group.tasks[0]?.tasks.map((t) => t.name)).toEqual(['Milk', 'Eggs'])
    expect(group.tasks[1]?.tasks).toEqual([])
  })

  it('ignores unknown/extra fields on group and task', () => {
    const text = JSON.stringify({
      name: 'G',
      color: 'red',
      tasks: [{ name: 'A', notes: 'hello', done: true }],
    })
    const group = ok(text)
    expect(group).toEqual({ name: 'G', tasks: [{ name: 'A', tasks: [] }] })
  })
})
