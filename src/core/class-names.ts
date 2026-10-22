import { twMerge } from 'tailwind-merge';

const joinClassNames = (...classNames: Array<string | false | null | undefined>): string =>
  twMerge(classNames.filter(Boolean).join(' '));

export default joinClassNames;
