import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import AppError from '@/core/app-error';
import createCategory from '@/features/categories/actions/create-category';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

test('the name is trimmed before it is sent', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.post('/backend/categories', async ({ request }) => {
      receivedBody = await request.json();
      return HttpResponse.json({ id: 'c1', name: 'Health', color: '#8fae9a' }, { status: 201 });
    }),
  );

  await createCategory({ categoryName: '  Health  ', categoryColor: '#8fae9a' });

  expect(receivedBody).toEqual({ name: 'Health', color: '#8fae9a' });
});

test('a blank name is refused without a request', async () => {
  const createFailure = await createCategory({
    categoryName: '   ',
    categoryColor: '#8fae9a',
  }).catch((createError: unknown) => createError);

  expect(createFailure).toBeInstanceOf(AppError);
  expect(createFailure).toMatchObject({ title: 'Name the category' });
});
