import { AtSign } from 'lucide-react';
import Input from '@/core/components/atoms/input';
import CodeInput from '@/core/components/molecules/code-input';
import Field from '@/core/components/molecules/field';
import PasswordInput from '@/core/components/molecules/password-input';
import SecurityDialog from '@/features/settings/components/security-dialog';

const ChangeEmailDialog = () => (
  <SecurityDialog
    id="change-email-dialog"
    title="Change email"
    description="We’ll send a link to the new address. Your email only changes once you open it."
    icon={<AtSign />}
    confirmLabel="Send confirmation link"
  >
    <Field label="New email" htmlFor="change-email-new">
      <Input id="change-email-new" name="newEmail" type="email" autoComplete="email" />
    </Field>
    <Field label="Password" htmlFor="change-email-password">
      <PasswordInput id="change-email-password" name="password" autoComplete="current-password" />
    </Field>
    <Field label="Authenticator code" htmlFor="change-email-code">
      <CodeInput id="change-email-code" name="code" />
    </Field>
  </SecurityDialog>
);

export default ChangeEmailDialog;
