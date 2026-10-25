import type { AccentColor, ThemeMode } from '@/core/appearance';

type SignedInUser = {
  name: string;
  email: string;
  accentColor: AccentColor;
  theme: ThemeMode;
};

export const initialsOf = (personName: string) =>
  personName
    .split(/\s+/)
    .filter((nameWord) => nameWord !== '')
    .slice(0, 2)
    .map((nameWord) => nameWord.charAt(0).toUpperCase())
    .join('');

export default SignedInUser;
