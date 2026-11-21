import apiClient from '@/core/api/api-client';
import type { UpNextRecord } from '@/features/today/entities/up-next-task';

const backendUpNextSource = {
  find: () => apiClient.get<UpNextRecord>('/today/up-next'),
};

export default backendUpNextSource;
