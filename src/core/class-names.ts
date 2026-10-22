import { extendTailwindMerge } from 'tailwind-merge';

const mergeClassNames = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        'background',
        'surface',
        'surface-strong',
        'foreground',
        'muted-foreground',
        'border',
        'border-strong',
        'primary',
        'primary-hover',
        'primary-foreground',
        'primary-soft',
        'primary-soft-foreground',
        'glow',
        'success',
        'success-soft',
        'warning',
        'warning-soft',
        'danger',
        'danger-soft',
        'ink',
        'ink-foreground',
        'ink-muted',
      ],
      shadow: ['soft', 'lift', 'glow'],
    },
  },
});

const joinClassNames = (...classNames: Array<string | false | null | undefined>): string =>
  mergeClassNames(classNames.filter(Boolean).join(' '));

export default joinClassNames;
