type DeviceRule = { pattern: RegExp; name: string };

const PLATFORM_RULES: readonly DeviceRule[] = [
  { pattern: /iPhone/, name: 'iPhone' },
  { pattern: /iPad/, name: 'iPad' },
  { pattern: /Android/, name: 'Android' },
  { pattern: /Windows/, name: 'Windows' },
  { pattern: /CrOS/, name: 'Chromebook' },
  { pattern: /Macintosh|Mac OS X/, name: 'Mac' },
  { pattern: /Linux/, name: 'Linux' },
];

const BROWSER_RULES: readonly DeviceRule[] = [
  { pattern: /Edg(?:e|A|iOS)?\//, name: 'Edge' },
  { pattern: /Firefox\/|FxiOS\//, name: 'Firefox' },
  { pattern: /OPR\//, name: 'Opera' },
  { pattern: /Chrome\/|CriOS\//, name: 'Chrome' },
  { pattern: /Safari\//, name: 'Safari' },
];

const FALLBACK_PLATFORM_NAME = 'This device';
const FALLBACK_BROWSER_NAME = 'Browser';
const TOUCH_MAC_POINT_COUNT = 1;

const matchName = (userAgent: string, deviceRules: readonly DeviceRule[], fallbackName: string) =>
  deviceRules.find((deviceRule) => deviceRule.pattern.test(userAgent))?.name ?? fallbackName;

const deviceName = (userAgent: string, maxTouchPoints: number): string => {
  const platformName = matchName(userAgent, PLATFORM_RULES, FALLBACK_PLATFORM_NAME);
  const shownPlatformName =
    platformName === 'Mac' && maxTouchPoints > TOUCH_MAC_POINT_COUNT ? 'iPad' : platformName;
  return `${shownPlatformName} · ${matchName(userAgent, BROWSER_RULES, FALLBACK_BROWSER_NAME)}`;
};

export default deviceName;
