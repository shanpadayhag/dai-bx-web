import type { Components } from 'react-markdown';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type CardNotesProps = {
  notes: string;
};

const noteComponents: Components = {
  h1: ({ children }) => (
    <h3 className="mt-4 text-sm font-semibold text-foreground first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-4 text-sm font-semibold text-foreground first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-3 text-sm font-medium text-foreground first:mt-0">{children}</h4>
  ),
  p: ({ children }) => <p className="mt-1.5 first:mt-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mt-1.5 grid list-disc gap-1 pl-5 marker:text-muted-foreground">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-1.5 grid list-decimal gap-1 pl-5 marker:text-muted-foreground">{children}</ol>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-surface-strong px-1 py-0.5 font-mono text-[12px] text-foreground">
      {children}
    </code>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="mt-1.5 border-l-2 border-border-strong pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
};

const CardNotes = ({ notes }: CardNotesProps) => (
  <div className="text-sm leading-relaxed text-muted-foreground">
    <Markdown remarkPlugins={[remarkGfm]} components={noteComponents}>
      {notes}
    </Markdown>
  </div>
);

export default CardNotes;
