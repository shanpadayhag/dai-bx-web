import { describe, expect, test } from 'vitest';
import { highlightParts, searchWords } from '@/features/search/entities/search-words';

describe('searchWords', () => {
  test('splits, lowercases and trims words the way the API does', () => {
    expect(searchWords('  Rev PLAN  ')).toEqual(['rev', 'plan']);
  });

  test('keeps accented and Chinese words and drops emoji and punctuation', () => {
    expect(searchWords('Café 中文学习')).toEqual(['café', '中文学习']);
    expect(searchWords('gym🏋️,swim—run')).toEqual(['gym', 'swim', 'run']);
  });

  test('never keeps search operator characters', () => {
    expect(searchWords("a&b | !c :* 'd' (e)")).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  test('cuts long words at 50 characters, drops repeats and keeps at most six', () => {
    expect(searchWords('a'.repeat(80))).toEqual(['a'.repeat(50)]);
    expect(searchWords('plan Plan PLAN review')).toEqual(['plan', 'review']);
    expect(searchWords('one two three four five six seven')).toHaveLength(6);
  });

  test('punctuation alone gives no words', () => {
    expect(searchWords('— !! ...')).toEqual([]);
  });
});

describe('highlightParts', () => {
  test('marks the start of each word that a search word begins', () => {
    expect(highlightParts('Planning review', ['rev', 'plan'])).toEqual([
      { text: 'Plan', isMatch: true },
      { text: 'ning ', isMatch: false },
      { text: 'rev', isMatch: true },
      { text: 'iew', isMatch: false },
    ]);
  });

  test('marks the longest matching search word', () => {
    expect(highlightParts('Planning', ['p', 'plann'])).toEqual([
      { text: 'Plann', isMatch: true },
      { text: 'ing', isMatch: false },
    ]);
  });

  test('never marks the middle of a word', () => {
    expect(highlightParts('Replan it', ['plan'])).toEqual([{ text: 'Replan it', isMatch: false }]);
  });

  test('keeps punctuation and spacing as they were', () => {
    const highlightedText = highlightParts('Groceries › Fruit, apples', ['fru', 'app'])
      .map((highlightPart) => highlightPart.text)
      .join('');
    expect(highlightedText).toBe('Groceries › Fruit, apples');
  });

  test('marks nothing without search words', () => {
    expect(highlightParts('Plan', [])).toEqual([{ text: 'Plan', isMatch: false }]);
  });
});
