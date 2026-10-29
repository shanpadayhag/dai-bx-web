import AppError from '@/core/app-error';

export const SIGNED_OUT_EVENT_NAME = 'daibx:signed-out';
export const UNREACHABLE_STATUS = 0;

const titleForStatus = (responseStatus: number) => {
  if (responseStatus === UNREACHABLE_STATUS) return "Couldn't reach DaiBX";
  if (responseStatus === 401) return "Sign-in didn't work";
  if (responseStatus === 403) return 'Not allowed';
  if (responseStatus === 409) return 'Already in use';
  if (responseStatus === 422) return 'Check that again';
  if (responseStatus === 429) return 'Too many attempts';
  return 'Something broke on our side';
};

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;

const pluralize = (unitCount: number, unitName: string) =>
  `${unitCount} ${unitName}${unitCount === 1 ? '' : 's'}`;

export const describeRetryWait = (retryAfterSeconds: number) => {
  if (retryAfterSeconds < SECONDS_PER_MINUTE) return pluralize(retryAfterSeconds, 'second');
  if (retryAfterSeconds < SECONDS_PER_HOUR) {
    return pluralize(Math.ceil(retryAfterSeconds / SECONDS_PER_MINUTE), 'minute');
  }
  return pluralize(Math.ceil(retryAfterSeconds / SECONDS_PER_HOUR), 'hour');
};

const toSentence = (safeMessage: string) => {
  const trimmedMessage = safeMessage.trim();
  const capitalizedMessage = trimmedMessage.charAt(0).toUpperCase() + trimmedMessage.slice(1);
  return /[.!?]$/.test(capitalizedMessage) ? capitalizedMessage : `${capitalizedMessage}.`;
};

const describeFailure = (safeMessage: string, retryAfterSeconds: number | null) =>
  retryAfterSeconds === null
    ? toSentence(safeMessage)
    : `Wait ${describeRetryWait(retryAfterSeconds)} and try again.`;

export class ApiError extends AppError {
  readonly status: number;
  readonly retryAfterSeconds: number | null;
  readonly errorPath: string | null;

  constructor(
    responseStatus: number,
    safeMessage: string,
    retryAfterSeconds: number | null,
    errorPath: string | null = null,
  ) {
    super(titleForStatus(responseStatus), describeFailure(safeMessage, retryAfterSeconds));
    this.name = 'ApiError';
    this.status = responseStatus;
    this.retryAfterSeconds = retryAfterSeconds;
    this.errorPath = errorPath;
  }
}

export class SignedOutError extends AppError {
  constructor() {
    super("You've been signed out", 'Sign in again to carry on.');
    this.name = 'SignedOutError';
  }
}
