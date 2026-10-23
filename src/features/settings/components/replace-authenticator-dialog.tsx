import { Smartphone } from 'lucide-react';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PasswordInput from '@/core/components/molecules/password-input';
import SecurityDialog from '@/features/settings/components/security-dialog';

const ReplaceAuthenticatorDialog = () => (
  <SecurityDialog
    id="replace-authenticator-dialog"
    title="Replace authenticator"
    description="Use this for a new phone or a lost one. Afterwards your other devices are signed out and remembered devices are forgotten."
    icon={<Smartphone />}
    confirmLabel="Continue to setup"
  >
    <Field label="Password" htmlFor="replace-authenticator-password">
      <PasswordInput
        id="replace-authenticator-password"
        name="password"
        autoComplete="current-password"
      />
    </Field>
    <Field
      label="Current code or a recovery code"
      htmlFor="replace-authenticator-code"
      hint="Lost the old phone? Any unused recovery code works here."
    >
      <Input
        id="replace-authenticator-code"
        name="code"
        autoComplete="one-time-code"
        spellCheck={false}
        className="font-mono tracking-wide uppercase"
      />
    </Field>
  </SecurityDialog>
);

export default ReplaceAuthenticatorDialog;
