export const APP_HOME_PATH = '/today';
const SIGN_IN_PATH = '/sign-in';

export const buildSignInPath = (requestedPath: string) =>
  `${SIGN_IN_PATH}?next=${encodeURIComponent(requestedPath)}`;

const isSameSitePath = (candidatePath: string) =>
  candidatePath.startsWith('/') && !candidatePath.startsWith('//') && !candidatePath.includes('\\');

const parseReturnPath = (rawNextPath: string | null) =>
  rawNextPath !== null && isSameSitePath(rawNextPath) ? rawNextPath : APP_HOME_PATH;

export const readRequestedReturnPath = (locationSearch: string) =>
  parseReturnPath(new URLSearchParams(locationSearch).get('next'));

export default parseReturnPath;
