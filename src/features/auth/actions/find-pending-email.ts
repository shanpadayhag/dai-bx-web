import sessionStoragePendingEmailSource from '@/features/auth/data_sources/session_storage/pending-email-source';

const findPendingEmail = (): string | null => sessionStoragePendingEmailSource.find();

export default findPendingEmail;
