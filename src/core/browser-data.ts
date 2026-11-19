const DAIBX_KEY_PREFIX = 'daibx:';
const KEPT_KEYS: ReadonlySet<string> = new Set(['daibx:appearance']);

const removeDaibxKeys = (browserStorage: Storage) => {
  const removableKeys = Object.keys(browserStorage).filter(
    (storageKey) => storageKey.startsWith(DAIBX_KEY_PREFIX) && !KEPT_KEYS.has(storageKey),
  );
  for (const removableKey of removableKeys) browserStorage.removeItem(removableKey);
};

const clearBrowserData = () => {
  try {
    removeDaibxKeys(window.localStorage);
    removeDaibxKeys(window.sessionStorage);
  } catch {
    return;
  }
};

export default clearBrowserData;
