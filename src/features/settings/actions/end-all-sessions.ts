import backendAccountSource from '@/features/settings/data_sources/backend/account-source';

type EndAllSessionsParams = {
  password: string;
};

const endAllSessions = async (params: EndAllSessionsParams): Promise<void> => {
  await backendAccountSource.endAllSessions(params.password);
};

export default endAllSessions;
