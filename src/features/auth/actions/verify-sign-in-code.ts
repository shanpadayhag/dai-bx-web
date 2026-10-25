import backendAuthSource from '@/features/auth/data_sources/backend/auth-source';
import { rethrowAsExpiredStep } from '@/features/auth/entities/expired-step';

type VerifySignInCodeParams = {
  code: string;
  rememberDevice: boolean;
};

const verifySignInCode = async (params: VerifySignInCodeParams): Promise<number | null> => {
  const signedInAnswer = await backendAuthSource
    .verifySignInCode(params.code.trim(), params.rememberDevice)
    .catch(rethrowAsExpiredStep);
  return signedInAnswer.remainingRecoveryCodes ?? null;
};

export default verifySignInCode;
