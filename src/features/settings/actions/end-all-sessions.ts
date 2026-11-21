import unsubscribeThisBrowser from '@/features/notifications/actions/unsubscribe-this-browser';
import backendAccountSource from '@/features/settings/data_sources/backend/account-source';

type EndAllSessionsParams = {
  password: string;
};

const endAllSessions = async (params: EndAllSessionsParams): Promise<void> => {
  await backendAccountSource.endAllSessions(params.password);
  await unsubscribeThisBrowser();
};

export default endAllSessions;
