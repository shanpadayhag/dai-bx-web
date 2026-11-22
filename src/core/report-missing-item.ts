import { toast } from 'sonner';

const reportMissingItem = (itemNoun: string) =>
  toast.error(`That ${itemNoun} isn’t here any more`, {
    description: 'It may have been moved or deleted.',
  });

export default reportMissingItem;
