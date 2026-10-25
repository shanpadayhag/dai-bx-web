import type { AccentColor, ThemeMode } from '@/core/appearance';

type SignedInUser = {
  name: string;
  email: string;
  accentColor: AccentColor;
  theme: ThemeMode;
};

export default SignedInUser;
