import backendAuthSource from '@/features/auth/data_sources/backend/auth-source';
import sessionStoragePendingEmailSource from '@/features/auth/data_sources/session_storage/pending-email-source';
import type { NextStep } from '@/features/auth/entities/next-step';

type SignInParams = {
  email: string;
  password: string;
};

const signIn = async (params: SignInParams): Promise<NextStep> => {
  const trimmedEmail = params.email.trim();
  const signInAnswer = await backendAuthSource.signIn(trimmedEmail, params.password);
  if (signInAnswer.next === 'verify_email') sessionStoragePendingEmailSource.save(trimmedEmail);
  return signInAnswer.next;
};

export default signIn;
