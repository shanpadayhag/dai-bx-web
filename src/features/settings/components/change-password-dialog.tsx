import { LockKeyhole } from 'lucide-react';
import type { FormEvent } from 'react';
import Field from '@/core/components/molecules/field';
import PasswordInput from '@/core/components/molecules/password-input';
import SecurityDialog from '@/features/settings/components/security-dialog';

export const CHANGE_PASSWORD_DIALOG_ID = 'change-password-dialog';

type ChangePasswordDialogProps = {
  isSubmitting: boolean;
  onSubmit: (submitEvent: FormEvent<HTMLFormElement>) => void;
};

const ChangePasswordDialog = ({ isSubmitting, onSubmit }: ChangePasswordDialogProps) => (
  <SecurityDialog
    id={CHANGE_PASSWORD_DIALOG_ID}
    title="Change password"
    description="Your other devices are signed out. This one stays signed in."
    icon={<LockKeyhole />}
    confirmLabel="Change password"
    isSubmitting={isSubmitting}
    onSubmit={onSubmit}
  >
    <Field label="Current password" htmlFor="change-password-current">
      <PasswordInput
        id="change-password-current"
        name="currentPassword"
        autoComplete="current-password"
      />
    </Field>
    <Field
      label="New password"
      htmlFor="change-password-new"
      hint="15 to 128 characters. A few unrelated words make a strong one."
    >
      <PasswordInput id="change-password-new" name="newPassword" autoComplete="new-password" />
    </Field>
  </SecurityDialog>
);

export default ChangePasswordDialog;
