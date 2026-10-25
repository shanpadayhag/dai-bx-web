import backendAccountSource from '@/features/settings/data_sources/backend/account-source';
import type { Account } from '@/features/settings/entities/account';

const findAccount = (): Promise<Account> => backendAccountSource.find();

export default findAccount;
