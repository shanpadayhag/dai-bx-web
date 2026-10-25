import { Copy, LifeBuoy } from 'lucide-react';
import type { FormEvent } from 'react';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PasswordInput from '@/core/components/molecules/password-input';
import RecoveryCodeGrid from '@/core/components/molecules/recovery-code-grid';
import SecurityDialog from '@/features/settings/components/security-dialog';

export const NEW_RECOVERY_CODES_DIALOG_ID = 'new-recovery-codes-dialog';

type NewRecoveryCodesDialogProps = {
  newRecoveryCodes: readonly string[] | null;
  isSubmitting: boolean;
  onSubmit: (submitEvent: FormEvent<HTMLFormElement>) => void;
  onCopyCodes: () => void;
  onDone: () => void;
};

const NewRecoveryCodesDialog = ({
  newRecoveryCodes,
  isSubmitting,
  onSubmit,
  onCopyCodes,
  onDone,
}: NewRecoveryCodesDialogProps) => (
  <SecurityDialog
    id={NEW_RECOVERY_CODES_DIALOG_ID}
    title="Make new recovery codes"
    description={
      newRecoveryCodes === null
        ? 'You’ll get 10 new codes to save. Every code you have now stops working.'
        : 'Save these now. They’re shown once, and your old codes no longer work.'
    }
    icon={<LifeBuoy />}
    confirmLabel="Make new codes"
    isSubmitting={isSubmitting}
    onSubmit={onSubmit}
    completedContent={
      newRecoveryCodes === null ? undefined : (
        <div className="grid gap-4">
          <RecoveryCodeGrid recoveryCodes={newRecoveryCodes} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCopyCodes}>
              <Copy />
              Copy all
            </Button>
            <Button onClick={onDone}>I’ve saved them</Button>
          </div>
        </div>
      )
    }
  >
    <Field label="Password" htmlFor="new-codes-password">
      <PasswordInput id="new-codes-password" name="password" autoComplete="current-password" />
    </Field>
    <Field
      label="Authenticator code"
      htmlFor="new-codes-code"
      hint="A recovery code works here too."
    >
      <Input
        id="new-codes-code"
        name="code"
        autoComplete="one-time-code"
        spellCheck={false}
        className="font-mono tracking-wide"
      />
    </Field>
  </SecurityDialog>
);

export default NewRecoveryCodesDialog;
