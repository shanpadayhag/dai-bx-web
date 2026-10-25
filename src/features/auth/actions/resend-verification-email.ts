import backendAuthSource from '@/features/auth/data_sources/backend/auth-source';

type ResendVerificationEmailParams = {
  email: string;
};

const resendVerificationEmail = async (params: ResendVerificationEmailParams): Promise<void> => {
  await backendAuthSource.resendVerificationEmail(params.email);
};

export default resendVerificationEmail;
