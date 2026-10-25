import backendAuthSource from '@/features/auth/data_sources/backend/auth-source';
import type { NextStep } from '@/features/auth/entities/next-step';

type VerifyEmailParams = {
  linkToken: string;
};

const verifyEmail = async (params: VerifyEmailParams): Promise<NextStep> => {
  const verifyAnswer = await backendAuthSource.verifyEmail(params.linkToken);
  return verifyAnswer.next;
};

export default verifyEmail;
