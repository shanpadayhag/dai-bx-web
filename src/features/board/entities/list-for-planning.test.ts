import { describe, expect, test } from 'vitest';
import type ListExport from '@/features/board/entities/list-export';
import { formatListForPlanning } from '@/features/board/entities/list-for-planning';

describe('formatListForPlanning', () => {
  test('heads the list and writes one block per card, keeping numbers as written', () => {
    const listExport: ListExport = {
      board: { name: 'Personal' },
      list: { name: 'This week' },
      cards: [
        {
          id: '0190a1b2-0000-7000-8000-000000000001',
          title: 'Study Chinese',
          dueDate: '2026-11-05',
          dueTime: '18:00',
          values: [
            { property: 'Project', value: 'Chinese' },
            { property: 'Hours', value: '2.50' },
          ],
          notes: '## Outcome\n- [ ] HSK 3 list\n\n',
        },
        {
          id: '0190a1b2-0000-7000-8000-000000000002',
          title: 'Pay rent',
          dueDate: '2026-11-07',
          dueTime: null,
          values: [],
          notes: '',
        },
      ],
    };

    expect(formatListForPlanning(listExport)).toBe(
      [
        'List: This week · Board: Personal',
        '',
        '---',
        '# Study Chinese',
        '- Card: 0190a1b2-0000-7000-8000-000000000001',
        '- Due: 2026-11-05 18:00',
        '- Project: Chinese',
        '- Hours: 2.50',
        '## Outcome',
        '- [ ] HSK 3 list',
        '',
        '---',
        '# Pay rent',
        '- Card: 0190a1b2-0000-7000-8000-000000000002',
        '- Due: 2026-11-07',
        '',
      ].join('\n'),
    );
  });

  test('leaves out the due line for a card with no date, and writes only the heading for an empty list', () => {
    const undatedExport: ListExport = {
      board: { name: 'Personal' },
      list: { name: 'Someday' },
      cards: [{ id: 'card', title: 'Read', dueDate: null, dueTime: null, values: [], notes: '' }],
    };

    expect(formatListForPlanning(undatedExport)).not.toContain('Due:');
    expect(formatListForPlanning({ ...undatedExport, cards: [] })).toBe(
      'List: Someday · Board: Personal\n',
    );
  });
});
