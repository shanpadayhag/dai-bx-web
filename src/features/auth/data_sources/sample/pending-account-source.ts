import type { PendingAccount } from '@/features/auth/entities/pending-account';

const samplePendingAccountSource = {
  find: (): PendingAccount => ({ email: 'you@example.com' }),
};

export default samplePendingAccountSource;
