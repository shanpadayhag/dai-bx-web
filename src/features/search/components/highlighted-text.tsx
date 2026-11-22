import { highlightParts } from '@/features/search/entities/search-words';

type HighlightedTextProps = {
  text: string;
  words: readonly string[];
};

const HighlightedText = ({ text, words }: HighlightedTextProps) => (
  <>
    {highlightParts(text, words).map((highlightPart, partIndex) =>
      highlightPart.isMatch ? (
        <mark
          key={partIndex}
          className="rounded-[3px] bg-primary-soft text-primary-soft-foreground"
        >
          {highlightPart.text}
        </mark>
      ) : (
        <span key={partIndex}>{highlightPart.text}</span>
      ),
    )}
  </>
);

export default HighlightedText;
