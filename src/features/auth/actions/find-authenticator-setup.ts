import backendAuthSource from '@/features/auth/data_sources/backend/auth-source';
import type { AuthenticatorSetup } from '@/features/auth/entities/authenticator-setup';
import { rethrowAsExpiredStep } from '@/features/auth/entities/expired-step';

const findAuthenticatorSetup = async (): Promise<AuthenticatorSetup> =>
  backendAuthSource.findAuthenticatorSetup().catch(rethrowAsExpiredStep);

export default findAuthenticatorSetup;
