import backendAuthSource from '@/features/auth/data_sources/backend/auth-source';

const signOut = async (): Promise<void> => {
  await backendAuthSource.signOut();
};

export default signOut;
