import { Copy, Download, LifeBuoy } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import Checkbox from '@/core/components/atoms/checkbox';
import AuthFrame from '@/features/auth/components/auth-frame';
import AuthIcon from '@/features/auth/components/auth-icon';
import RecoveryCodeGrid from '@/features/auth/components/recovery-code-grid';
import sampleRecoveryCodeSource from '@/features/auth/data_sources/sample/recovery-code-source';

const RecoveryCodesPage = () => (
  <AuthFrame
    icon={
      <AuthIcon tone="warning">
        <LifeBuoy />
      </AuthIcon>
    }
    title="Save your recovery codes"
    description="If you lose your phone, each code signs you in once. This is the only time they’re shown, so keep them in your password manager or somewhere safe."
    footer="You can make a new set any time in Settings, which cancels this one."
  >
    <div className="grid gap-5">
      <RecoveryCodeGrid recoveryCodes={sampleRecoveryCodeSource.findAll()} />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary">
          <Copy />
          Copy all
        </Button>
        <Button variant="secondary">
          <Download />
          Download .txt
        </Button>
      </div>
      <form className="grid gap-4 border-t border-border pt-5">
        <Checkbox
          id="saved-codes"
          name="savedCodes"
          label="I’ve saved these codes somewhere safe"
        />
        <Button type="submit" size="lg" className="w-full">
          Continue to DaiBX
        </Button>
      </form>
    </div>
  </AuthFrame>
);

export default RecoveryCodesPage;
