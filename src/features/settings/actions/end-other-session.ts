import backendAccountSource from '@/features/settings/data_sources/backend/account-source';

type EndOtherSessionParams = {
  sessionId: string;
  password: string;
};

const endOtherSession = async (params: EndOtherSessionParams): Promise<void> => {
  await backendAccountSource.endSession(params.sessionId, params.password);
};

export default endOtherSession;
