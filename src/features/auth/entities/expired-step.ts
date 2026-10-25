import { ApiError } from '@/core/api/api-error';
import AppError from '@/core/app-error';

const UNAUTHORIZED_STATUS = 401;

export class ExpiredStepError extends AppError {
  constructor() {
    super('This step has expired', 'Start over from the sign-in page.');
    this.name = 'ExpiredStepError';
  }
}

export const rethrowAsExpiredStep = (stepError: unknown): never => {
  if (stepError instanceof ApiError && stepError.status === UNAUTHORIZED_STATUS) {
    throw new ExpiredStepError();
  }
  throw stepError;
};
