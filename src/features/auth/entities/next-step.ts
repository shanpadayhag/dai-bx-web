import { APP_HOME_PATH } from '@/features/auth/entities/return-path';

export type NextStep = 'verify_email' | 'set_up_authenticator' | 'enter_code' | 'signed_in';

export type NextStepAnswer = {
  next: NextStep;
};

const withReturnPath = (stepPath: string, returnPath: string) =>
  returnPath === APP_HOME_PATH ? stepPath : `${stepPath}?next=${encodeURIComponent(returnPath)}`;

const nextStepPath = (nextStep: NextStep, returnPath: string) => {
  if (nextStep === 'verify_email') return '/verify-email';
  if (nextStep === 'set_up_authenticator') return '/set-up-authenticator';
  if (nextStep === 'enter_code') return withReturnPath('/enter-code', returnPath);
  return returnPath;
};

export default nextStepPath;
