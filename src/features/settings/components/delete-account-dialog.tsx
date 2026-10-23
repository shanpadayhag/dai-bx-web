import { Trash2 } from 'lucide-react';
import Input from '@/core/components/atoms/input';
import CodeInput from '@/core/components/molecules/code-input';
import Field from '@/core/components/molecules/field';
import PasswordInput from '@/core/components/molecules/password-input';
import SecurityDialog from '@/features/settings/components/security-dialog';

const confirmationPhrase = 'delete my account';

const DeleteAccountDialog = () => (
  <SecurityDialog
    id="delete-account-dialog"
    title="Delete your account?"
    description="Your tasks, boards, calendar, categories and settings are erased right away. There’s no undo and no grace period."
    icon={<Trash2 />}
    isDestructive
    confirmLabel="Delete account"
  >
    <Field label="Password" htmlFor="delete-account-password">
      <PasswordInput id="delete-account-password" name="password" autoComplete="current-password" />
    </Field>
    <Field label="Authenticator code" htmlFor="delete-account-code">
      <CodeInput id="delete-account-code" name="code" />
    </Field>
    <Field label={`Type “${confirmationPhrase}” to confirm`} htmlFor="delete-account-confirmation">
      <Input
        id="delete-account-confirmation"
        name="confirmation"
        autoComplete="off"
        spellCheck={false}
        placeholder={confirmationPhrase}
      />
    </Field>
  </SecurityDialog>
);

export default DeleteAccountDialog;
