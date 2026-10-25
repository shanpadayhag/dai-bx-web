import backendAccountSource from '@/features/settings/data_sources/backend/account-source';
import type { IdentityProof } from '@/features/settings/entities/account';

type DeleteAccountParams = {
  identityProof: IdentityProof;
  confirmation: string;
};

const deleteAccount = async (params: DeleteAccountParams): Promise<void> => {
  await backendAccountSource.delete(params.identityProof, params.confirmation);
};

export default deleteAccount;
