import apiClient from '@/core/api/api-client';
import type UnauthorizedHandling from '@/core/api/unauthorized-handling';
import type Session from '@/features/auth/entities/session';

const backendSessionSource = {
  find: (unauthorizedHandling: UnauthorizedHandling) =>
    apiClient.get<Session>('/auth/session', { unauthorizedHandling }),
};

export default backendSessionSource;
