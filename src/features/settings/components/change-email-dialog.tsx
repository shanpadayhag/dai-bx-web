import { AtSign } from 'lucide-react';
import type { FormEvent } from 'react';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PasswordInput from '@/core/components/molecules/password-input';
import SecurityDialog from '@/features/settings/components/security-dialog';

export const CHANGE_EMAIL_DIALOG_ID = 'change-email-dialog';

type ChangeEmailDialogProps = {
  isSubmitting: boolean;
  onSubmit: (submitEvent: FormEvent<HTMLFormElement>) => void;
};

const ChangeEmailDialog = ({ isSubmitting, onSubmit }: ChangeEmailDialogProps) => (
  <SecurityDialog
    id={CHANGE_EMAIL_DIALOG_ID}
    title="Change email"
    description="We’ll send a link to the new address. Your email only changes once you open it."
    icon={<AtSign />}
    confirmLabel="Send confirmation link"
    isSubmitting={isSubmitting}
    onSubmit={onSubmit}
  >
    <Field label="New email" htmlFor="change-email-new">
      <Input id="change-email-new" name="newEmail" type="email" autoComplete="email" />
    </Field>
    <Field label="Password" htmlFor="change-email-password">
      <PasswordInput id="change-email-password" name="password" autoComplete="current-password" />
    </Field>
    <Field
      label="Authenticator code"
      htmlFor="change-email-code"
      hint="A recovery code works here too."
    >
      <Input
        id="change-email-code"
        name="code"
        autoComplete="one-time-code"
        spellCheck={false}
        className="font-mono tracking-wide"
      />
    </Field>
  </SecurityDialog>
);

export default ChangeEmailDialog;
