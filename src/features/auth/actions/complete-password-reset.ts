import backendAuthSource from '@/features/auth/data_sources/backend/auth-source';
import type { NextStep } from '@/features/auth/entities/next-step';

type CompletePasswordResetParams = {
  linkToken: string;
  password: string;
};

const completePasswordReset = async (params: CompletePasswordResetParams): Promise<NextStep> => {
  const resetAnswer = await backendAuthSource.completePasswordReset(
    params.linkToken,
    params.password,
  );
  return resetAnswer.next;
};

export default completePasswordReset;
