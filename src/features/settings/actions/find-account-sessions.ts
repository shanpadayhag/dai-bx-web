import backendAccountSource from '@/features/settings/data_sources/backend/account-source';
import type { AccountSession } from '@/features/settings/entities/account-session';

const findAccountSessions = async (): Promise<AccountSession[]> => {
  const sessionsAnswer = await backendAccountSource.listSessions();
  return sessionsAnswer.sessions;
};

export default findAccountSessions;
