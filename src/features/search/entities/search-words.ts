const SEARCH_WORD_LENGTH_MAX = 50;
const SEARCH_WORD_COUNT_MAX = 6;
const WORD_CHARACTER_PATTERN = /[\p{Alphabetic}\p{N}]+/gu;

type HighlightPart = {
  text: string;
  isMatch: boolean;
};

const searchWords = (queryText: string): string[] => {
  const foundWords: string[] = [];
  for (const wordMatch of queryText.matchAll(WORD_CHARACTER_PATTERN)) {
    const searchWord = [...wordMatch[0]].slice(0, SEARCH_WORD_LENGTH_MAX).join('').toLowerCase();
    if (!foundWords.includes(searchWord)) foundWords.push(searchWord);
    if (foundWords.length === SEARCH_WORD_COUNT_MAX) break;
  }
  return foundWords;
};

const longestMatchingPrefixLength = (word: string, words: readonly string[]): number => {
  const lowercaseWord = word.toLowerCase();
  return words.reduce(
    (longestLength, searchWord) =>
      lowercaseWord.startsWith(searchWord) && searchWord.length > longestLength
        ? searchWord.length
        : longestLength,
    0,
  );
};

const highlightParts = (text: string, words: readonly string[]): HighlightPart[] => {
  const highlightedParts: HighlightPart[] = [];
  const pushPart = (partText: string, isMatch: boolean) => {
    if (partText === '') return;
    const lastPart = highlightedParts.at(-1);
    if (lastPart !== undefined && lastPart.isMatch === isMatch) {
      lastPart.text += partText;
      return;
    }
    highlightedParts.push({ text: partText, isMatch });
  };
  let readIndex = 0;
  for (const wordMatch of text.matchAll(WORD_CHARACTER_PATTERN)) {
    const wordStart = wordMatch.index;
    const word = wordMatch[0];
    pushPart(text.slice(readIndex, wordStart), false);
    const matchedLength =
      word.toLowerCase().length === word.length ? longestMatchingPrefixLength(word, words) : 0;
    pushPart(word.slice(0, matchedLength), true);
    pushPart(word.slice(matchedLength), false);
    readIndex = wordStart + word.length;
  }
  pushPart(text.slice(readIndex), false);
  return highlightedParts;
};

export type { HighlightPart };
export { highlightParts, searchWords };
