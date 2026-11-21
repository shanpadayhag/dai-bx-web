import backendUpNextSource from '@/features/today/data_sources/backend/up-next-source';
import { upNextFromRecord, type UpNext } from '@/features/today/entities/up-next-task';

const findUpNext = async (): Promise<UpNext> => upNextFromRecord(await backendUpNextSource.find());

export default findUpNext;
