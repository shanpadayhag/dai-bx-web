import { Smartphone } from 'lucide-react';
import type { FormEvent } from 'react';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import AuthenticatorQr from '@/core/components/molecules/authenticator-qr';
import CodeInput from '@/core/components/molecules/code-input';
import Field from '@/core/components/molecules/field';
import ManualKey from '@/core/components/molecules/manual-key';
import PasswordInput from '@/core/components/molecules/password-input';
import type { AuthenticatorSetup } from '@/features/auth/entities/authenticator-setup';
import SecurityDialog from '@/features/settings/components/security-dialog';

export const REPLACE_AUTHENTICATOR_DIALOG_ID = 'replace-authenticator-dialog';

type ReplaceAuthenticatorDialogProps = {
  replacementSetup: AuthenticatorSetup | null;
  isSubmitting: boolean;
  onSubmitIdentity: (submitEvent: FormEvent<HTMLFormElement>) => void;
  onSubmitNewCode: (submitEvent: FormEvent<HTMLFormElement>) => void;
};

const ReplaceAuthenticatorDialog = ({
  replacementSetup,
  isSubmitting,
  onSubmitIdentity,
  onSubmitNewCode,
}: ReplaceAuthenticatorDialogProps) => (
  <SecurityDialog
    id={REPLACE_AUTHENTICATOR_DIALOG_ID}
    title="Replace authenticator"
    description={
      replacementSetup === null
        ? 'Use this for a new phone or a lost one. Afterwards your other devices are signed out and remembered devices are forgotten.'
        : 'Scan this with the new app, then enter the code it shows. The old app stops working once you confirm.'
    }
    icon={<Smartphone />}
    confirmLabel="Continue to setup"
    isSubmitting={isSubmitting}
    onSubmit={onSubmitIdentity}
    completedContent={
      replacementSetup === null ? undefined : (
        <form className="grid gap-4" onSubmit={onSubmitNewCode}>
          <AuthenticatorQr otpauthUri={replacementSetup.otpauthUri} />
          <ManualKey secretKey={replacementSetup.manualEntryKey.replaceAll(' ', '')} />
          <Field label="Code from the new app" htmlFor="replace-authenticator-new-code">
            <CodeInput id="replace-authenticator-new-code" name="code" />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              Replace authenticator
            </Button>
          </div>
        </form>
      )
    }
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
