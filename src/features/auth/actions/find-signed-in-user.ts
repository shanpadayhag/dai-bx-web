import { ApiError } from '@/core/api/api-error';
import type UnauthorizedHandling from '@/core/api/unauthorized-handling';
import backendSessionSource from '@/features/auth/data_sources/backend/session-source';
import type SignedInUser from '@/features/auth/entities/signed-in-user';

type FindSignedInUserParams = {
  unauthorizedHandling: UnauthorizedHandling;
};

const UNAUTHORIZED_STATUS = 401;

const findSignedInUser = async (params: FindSignedInUserParams): Promise<SignedInUser | null> => {
  try {
    const currentSession = await backendSessionSource.find(params.unauthorizedHandling);
    return currentSession.user;
  } catch (sessionError) {
    if (sessionError instanceof ApiError && sessionError.status === UNAUTHORIZED_STATUS)
      return null;
    throw sessionError;
  }
};

export default findSignedInUser;
