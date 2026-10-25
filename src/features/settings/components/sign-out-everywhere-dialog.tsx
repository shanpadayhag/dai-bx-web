import { LogOut } from 'lucide-react';
import type { FormEvent } from 'react';
import SecurityDialog from '@/features/settings/components/security-dialog';

type SignOutEverywhereDialogProps = {
  activeSessionCount: number;
  isSubmitting: boolean;
  onSubmit: (submitEvent: FormEvent<HTMLFormElement>) => void;
};

const SignOutEverywhereDialog = ({
  activeSessionCount,
  isSubmitting,
  onSubmit,
}: SignOutEverywhereDialogProps) => (
  <SecurityDialog
    id="sign-out-everywhere-dialog"
    title="Sign out everywhere?"
    description={`Ends ${activeSessionCount === 1 ? 'your only session' : `all ${activeSessionCount} sessions, including this one,`} and forgets every remembered device. You’ll need your authenticator on the next sign-in.`}
    icon={<LogOut />}
    confirmLabel="Sign out everywhere"
    isSubmitting={isSubmitting}
    onSubmit={onSubmit}
  />
);

export default SignOutEverywhereDialog;
