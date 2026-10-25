import backendAuthSource from '@/features/auth/data_sources/backend/auth-source';

type RequestPasswordResetParams = {
  email: string;
};

const requestPasswordReset = async (params: RequestPasswordResetParams): Promise<void> => {
  await backendAuthSource.requestPasswordReset(params.email.trim());
};

export default requestPasswordReset;
