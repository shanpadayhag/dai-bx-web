import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import AppError from '@/core/app-error';
import updateCategory from '@/features/categories/actions/update-category';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

test('a new name is trimmed before it is sent', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.patch('/backend/categories/c1', async ({ request }) => {
      receivedBody = await request.json();
      return HttpResponse.json({ id: 'c1', name: 'Chinese', color: '#be7e86' });
    }),
  );

  await updateCategory({ categoryId: 'c1', categoryChanges: { name: ' Chinese ' } });

  expect(receivedBody).toEqual({ name: 'Chinese' });
});

test('a blank new name is refused without a request', async () => {
  const updateFailure = await updateCategory({
    categoryId: 'c1',
    categoryChanges: { name: ' ' },
  }).catch((updateError: unknown) => updateError);

  expect(updateFailure).toBeInstanceOf(AppError);
});
