import backendAuthSource from '@/features/auth/data_sources/backend/auth-source';
import sessionStoragePendingEmailSource from '@/features/auth/data_sources/session_storage/pending-email-source';
import type { NextStep } from '@/features/auth/entities/next-step';

type VerifyEmailParams = {
  linkToken: string;
};

const verifyEmail = async (params: VerifyEmailParams): Promise<NextStep> => {
  const verifyAnswer = await backendAuthSource.verifyEmail(params.linkToken);
  sessionStoragePendingEmailSource.remove();
  return verifyAnswer.next;
};

export default verifyEmail;
