'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import IconButton from '@/core/components/atoms/icon-button';

type ManualKeyProps = {
  secretKey: string;
};

const groupInFours = (secretKey: string): string[] => secretKey.match(/.{1,4}/g) ?? [];

const ManualKey = ({ secretKey }: ManualKeyProps) => (
  <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-surface py-1 pr-1 pl-3">
    <code className="font-mono text-[13px] tracking-wide text-foreground">
      {groupInFours(secretKey).join(' ')}
    </code>
    <IconButton
      label="Copy key"
      onClick={() =>
        void navigator.clipboard
          .writeText(secretKey)
          .then(() => toast.success('Key copied'))
          .catch(() => toast.error('Couldn’t copy', { description: 'Select the key and copy it.' }))
      }
    >
      <Copy />
    </IconButton>
  </div>
);

export default ManualKey;
