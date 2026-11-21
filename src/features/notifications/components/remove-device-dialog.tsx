import { BellOff } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';

export const REMOVE_DEVICE_DIALOG_ID = 'remove-device-dialog';

type RemoveDeviceDialogProps = {
  deviceName: string | null;
  isSubmitting: boolean;
  onConfirm: () => void;
};

const RemoveDeviceDialog = ({ deviceName, isSubmitting, onConfirm }: RemoveDeviceDialogProps) => (
  <PopoverPanel
    id={REMOVE_DEVICE_DIALOG_ID}
    label="Remove device"
    className="w-[min(400px,calc(100vw-2rem))]"
  >
    <div className="grid gap-4 p-5">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
        <BellOff className="size-5" />
      </span>
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-foreground">
          Stop notifications on {deviceName ?? 'this device'}?
        </h2>
        <p className="text-sm text-muted-foreground">
          It stays signed in. Turn notifications on there again whenever you want them back.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" popoverTarget={REMOVE_DEVICE_DIALOG_ID} popoverTargetAction="hide">
          Cancel
        </Button>
        <Button variant="danger" disabled={isSubmitting || deviceName === null} onClick={onConfirm}>
          Remove device
        </Button>
      </div>
    </div>
  </PopoverPanel>
);

export default RemoveDeviceDialog;
