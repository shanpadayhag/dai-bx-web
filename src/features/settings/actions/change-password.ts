import backendAccountSource from '@/features/settings/data_sources/backend/account-source';

type ChangePasswordParams = {
  currentPassword: string;
  newPassword: string;
};

const changePassword = async (params: ChangePasswordParams): Promise<void> => {
  await backendAccountSource.changePassword(params.currentPassword, params.newPassword);
};

export default changePassword;
