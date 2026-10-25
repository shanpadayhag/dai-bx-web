import backendAuthSource from '@/features/auth/data_sources/backend/auth-source';

type ConfirmEmailChangeParams = {
  linkToken: string;
};

const confirmEmailChange = async (params: ConfirmEmailChangeParams): Promise<void> => {
  await backendAuthSource.confirmEmailChange(params.linkToken);
};

export default confirmEmailChange;
