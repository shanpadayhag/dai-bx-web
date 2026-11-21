import backendAuthSource from '@/features/auth/data_sources/backend/auth-source';
import unsubscribeThisBrowser from '@/features/notifications/actions/unsubscribe-this-browser';

const signOut = async (): Promise<void> => {
  await backendAuthSource.signOut();
  await unsubscribeThisBrowser();
};

export default signOut;
