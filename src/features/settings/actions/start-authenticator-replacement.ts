import findAuthenticatorSetup from '@/features/auth/actions/find-authenticator-setup';
import type { AuthenticatorSetup } from '@/features/auth/entities/authenticator-setup';
import backendAccountSource from '@/features/settings/data_sources/backend/account-source';
import type { IdentityProof } from '@/features/settings/entities/account';

type StartAuthenticatorReplacementParams = {
  identityProof: IdentityProof;
};

const startAuthenticatorReplacement = async (
  params: StartAuthenticatorReplacementParams,
): Promise<AuthenticatorSetup> => {
  await backendAccountSource.startAuthenticatorReplacement(params.identityProof);
  return findAuthenticatorSetup();
};

export default startAuthenticatorReplacement;
