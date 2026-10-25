import backendAuthSource, {
  type NewAccount,
} from '@/features/auth/data_sources/backend/auth-source';
import sessionStoragePendingEmailSource from '@/features/auth/data_sources/session_storage/pending-email-source';

type SignUpParams = NewAccount;

const signUp = async (params: SignUpParams): Promise<void> => {
  const trimmedEmail = params.email.trim();
  await backendAuthSource.signUp({
    inviteCode: params.inviteCode.trim(),
    name: params.name.trim(),
    email: trimmedEmail,
    password: params.password,
  });
  sessionStoragePendingEmailSource.save(trimmedEmail);
};

export default signUp;
