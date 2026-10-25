import backendAccountSource from '@/features/settings/data_sources/backend/account-source';

type ConfirmAuthenticatorReplacementParams = {
  code: string;
};

const confirmAuthenticatorReplacement = async (
  params: ConfirmAuthenticatorReplacementParams,
): Promise<void> => {
  await backendAccountSource.confirmAuthenticatorReplacement(params.code.trim());
};

export default confirmAuthenticatorReplacement;
