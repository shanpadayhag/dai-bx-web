import backendAccountSource from '@/features/settings/data_sources/backend/account-source';
import type { IdentityProof } from '@/features/settings/entities/account';

type RegenerateRecoveryCodesParams = {
  identityProof: IdentityProof;
};

const regenerateRecoveryCodes = async (
  params: RegenerateRecoveryCodesParams,
): Promise<string[]> => {
  const regenerateAnswer = await backendAccountSource.regenerateRecoveryCodes(params.identityProof);
  return regenerateAnswer.recoveryCodes;
};

export default regenerateRecoveryCodes;
