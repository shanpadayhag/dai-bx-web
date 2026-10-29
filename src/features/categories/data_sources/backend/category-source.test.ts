import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import backendCategorySource from '@/features/categories/data_sources/backend/category-source';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const goalsCategory = { id: 'category-goals', name: 'Goals', color: '#7c95bd' };

test('lists categories from GET /categories', async () => {
  backendServer.use(http.get('/backend/categories', () => HttpResponse.json([goalsCategory])));

  await expect(backendCategorySource.findAll()).resolves.toEqual([goalsCategory]);
});

test('creates a category with POST /categories and its name and color', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.post('/backend/categories', async ({ request }) => {
      receivedBody = await request.json();
      return HttpResponse.json(goalsCategory, { status: 201 });
    }),
  );

  const createdCategory = await backendCategorySource.create({ name: 'Goals', color: '#7c95bd' });

  expect(receivedBody).toEqual({ name: 'Goals', color: '#7c95bd' });
  expect(createdCategory).toEqual(goalsCategory);
});

test('updates a category with PATCH /categories/{id} and only the changed fields', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.patch('/backend/categories/category-goals', async ({ request }) => {
      receivedBody = await request.json();
      return HttpResponse.json({ ...goalsCategory, color: '#000000' });
    }),
  );

  await backendCategorySource.update('category-goals', { color: '#000000' });

  expect(receivedBody).toEqual({ color: '#000000' });
});

test('deletes a category with DELETE /categories/{id}', async () => {
  let isDeleted = false;
  backendServer.use(
    http.delete('/backend/categories/category-goals', () => {
      isDeleted = true;
      return HttpResponse.json({ status: 'deleted' });
    }),
  );

  await backendCategorySource.delete('category-goals');

  expect(isDeleted).toBe(true);
});
