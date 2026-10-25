import backendAccountSource from '@/features/settings/data_sources/backend/account-source';
import type { IdentityProof } from '@/features/settings/entities/account';

type RequestEmailChangeParams = {
  identityProof: IdentityProof;
  newEmail: string;
};

const requestEmailChange = async (params: RequestEmailChangeParams): Promise<string> => {
  const trimmedNewEmail = params.newEmail.trim();
  await backendAccountSource.requestEmailChange(params.identityProof, trimmedNewEmail);
  return trimmedNewEmail;
};

export default requestEmailChange;
