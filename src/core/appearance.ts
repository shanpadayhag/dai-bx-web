export type AccentColor = 'blue' | 'indigo' | 'teal' | 'violet' | 'graphite';
export type ThemeMode = 'light' | 'dark' | 'system';

export type Appearance = {
  accentColor: AccentColor;
  theme: ThemeMode;
};

const APPEARANCE_STORAGE_KEY = 'daibx:appearance';
const DEFAULT_ACCENT_COLOR: AccentColor = 'blue';
const DEFAULT_THEME: ThemeMode = 'system';

export const APPEARANCE_BOOT_SCRIPT = `(function(){try{var a=JSON.parse(localStorage.getItem('${APPEARANCE_STORAGE_KEY}')||'null');if(!a)return;var r=document.documentElement;if(a.theme==='light'||a.theme==='dark')r.dataset.theme=a.theme;if(['indigo','teal','violet','graphite'].indexOf(a.accentColor)>-1)r.dataset.accent=a.accentColor;}catch(e){}})();`;

const setRootAttribute = (attributeName: 'theme' | 'accent', attributeValue: string | null) => {
  const rootElement = document.documentElement;
  if (attributeValue === null) {
    delete rootElement.dataset[attributeName];
    return;
  }
  rootElement.dataset[attributeName] = attributeValue;
};

const writeStoredAppearance = (storedAppearance: Appearance | null) => {
  try {
    if (storedAppearance === null) {
      window.localStorage.removeItem(APPEARANCE_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(storedAppearance));
  } catch {
    return;
  }
};

export const applyAppearance = (appearance: Appearance) => {
  setRootAttribute('theme', appearance.theme === DEFAULT_THEME ? null : appearance.theme);
  setRootAttribute(
    'accent',
    appearance.accentColor === DEFAULT_ACCENT_COLOR ? null : appearance.accentColor,
  );
  writeStoredAppearance({ accentColor: appearance.accentColor, theme: appearance.theme });
};

const ACCENT_COLORS: readonly AccentColor[] = ['blue', 'indigo', 'teal', 'violet', 'graphite'];
const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

export const readAppliedAppearance = (): Appearance => {
  const rootDataset = document.documentElement.dataset;
  const appliedAccentColor = ACCENT_COLORS.find(
    (accentColor) => accentColor === rootDataset.accent,
  );
  const appliedTheme = THEME_MODES.find((themeMode) => themeMode === rootDataset.theme);
  return {
    accentColor: appliedAccentColor ?? DEFAULT_ACCENT_COLOR,
    theme: appliedTheme ?? DEFAULT_THEME,
  };
};

export const forgetAppearance = () => {
  setRootAttribute('theme', null);
  setRootAttribute('accent', null);
  writeStoredAppearance(null);
};
