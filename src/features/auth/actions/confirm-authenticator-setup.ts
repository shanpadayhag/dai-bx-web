import backendAuthSource from '@/features/auth/data_sources/backend/auth-source';
import memoryRecoveryCodeSource from '@/features/auth/data_sources/memory/recovery-code-source';
import { rethrowAsExpiredStep } from '@/features/auth/entities/expired-step';

type ConfirmAuthenticatorSetupParams = {
  code: string;
};

const confirmAuthenticatorSetup = async (
  params: ConfirmAuthenticatorSetupParams,
): Promise<void> => {
  const confirmAnswer = await backendAuthSource
    .confirmAuthenticatorSetup(params.code.trim())
    .catch(rethrowAsExpiredStep);
  memoryRecoveryCodeSource.save(confirmAnswer.recoveryCodes);
};

export default confirmAuthenticatorSetup;
