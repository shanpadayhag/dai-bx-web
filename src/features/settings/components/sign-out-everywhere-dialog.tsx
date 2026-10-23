import { LogOut } from 'lucide-react';
import SecurityDialog from '@/features/settings/components/security-dialog';

type SignOutEverywhereDialogProps = {
  signedInDeviceCount: number;
};

const SignOutEverywhereDialog = ({ signedInDeviceCount }: SignOutEverywhereDialogProps) => (
  <SecurityDialog
    id="sign-out-everywhere-dialog"
    title="Sign out everywhere?"
    description={`Ends all ${signedInDeviceCount} sessions, including this one, and forgets every remembered device. You’ll need your authenticator on the next sign-in.`}
    icon={<LogOut />}
    confirmLabel="Sign out everywhere"
  />
);

export default SignOutEverywhereDialog;
