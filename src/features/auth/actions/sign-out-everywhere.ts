import backendAuthSource from '@/features/auth/data_sources/backend/auth-source';

const signOutEverywhere = async (): Promise<void> => {
  await backendAuthSource.signOutEverywhere();
};

export default signOutEverywhere;
