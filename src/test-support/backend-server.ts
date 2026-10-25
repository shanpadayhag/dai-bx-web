import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

const startBackendServer = () => {
  const backendServer = setupServer();
  beforeAll(() => backendServer.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => backendServer.resetHandlers());
  afterAll(() => backendServer.close());
  return backendServer;
};

export default startBackendServer;
