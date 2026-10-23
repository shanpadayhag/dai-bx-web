import { LifeBuoy } from 'lucide-react';
import CodeInput from '@/core/components/molecules/code-input';
import Field from '@/core/components/molecules/field';
import PasswordInput from '@/core/components/molecules/password-input';
import SecurityDialog from '@/features/settings/components/security-dialog';

const NewRecoveryCodesDialog = () => (
  <SecurityDialog
    id="new-recovery-codes-dialog"
    title="Make new recovery codes"
    description="You’ll get 10 new codes to save. Every code you have now stops working."
    icon={<LifeBuoy />}
    confirmLabel="Make new codes"
  >
    <Field label="Password" htmlFor="new-codes-password">
      <PasswordInput id="new-codes-password" name="password" autoComplete="current-password" />
    </Field>
    <Field label="Authenticator code" htmlFor="new-codes-code">
      <CodeInput id="new-codes-code" name="code" />
    </Field>
  </SecurityDialog>
);

export default NewRecoveryCodesDialog;
