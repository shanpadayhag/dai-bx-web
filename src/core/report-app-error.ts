import { toast } from 'sonner';
import AppError from '@/core/app-error';

const reportAppError = (reportedError: unknown) => {
  if (!(reportedError instanceof AppError)) throw reportedError;
  toast.error(reportedError.title, { description: reportedError.description });
};

export default reportAppError;
