'use client';

import { Copy, Download, LifeBuoy } from 'lucide-react';
import { useEffect } from 'react';
import Button from '@/core/components/atoms/button';
import Checkbox from '@/core/components/atoms/checkbox';
import AuthFrame from '@/features/auth/components/auth-frame';
import AuthIcon from '@/features/auth/components/auth-icon';
import RecoveryCodeGrid from '@/core/components/molecules/recovery-code-grid';
import { APP_HOME_PATH } from '@/features/auth/entities/return-path';
import useRecoveryCodesEvents from '@/features/auth/events/use-recovery-codes-events';
import useRecoveryCodesStates from '@/features/auth/states/use-recovery-codes-states';

const settingsFooter = 'You can make a new set any time in Settings, which cancels this one.';

const RecoveryCodesPage = () => {
  const states = useRecoveryCodesStates();
  const events = useRecoveryCodesEvents(states);
  const { handleLoadCodes } = events;

  useEffect(() => {
    handleLoadCodes();
  }, [handleLoadCodes]);

  if (states.recoveryCodesStatus === 'already_shown') {
    return (
      <AuthFrame
        icon={
          <AuthIcon tone="warning">
            <LifeBuoy />
          </AuthIcon>
        }
        title="Your codes were already shown"
        description="Recovery codes appear once, right after setup. If you didn’t save them, make a new set in Settings."
        footer={settingsFooter}
      >
        <Button href={APP_HOME_PATH} size="lg" className="w-full">
          Continue to DaiBX
        </Button>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      icon={
        <AuthIcon tone="warning">
          <LifeBuoy />
        </AuthIcon>
      }
      title="Save your recovery codes"
      description="If you lose your phone, each code signs you in once. This is the only time they’re shown, so keep them in your password manager or somewhere safe."
      footer={settingsFooter}
    >
      <div className="grid gap-5">
        <RecoveryCodeGrid recoveryCodes={states.recoveryCodes} />
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            disabled={states.recoveryCodes.length === 0}
            onClick={() => void events.handleCopyCodes()}
          >
            <Copy />
            Copy all
          </Button>
          <Button
            variant="secondary"
            disabled={states.recoveryCodes.length === 0}
            onClick={events.handleDownloadCodes}
          >
            <Download />
            Download .txt
          </Button>
        </div>
        <form
          className="grid gap-4 border-t border-border pt-5"
          onSubmit={(submitEvent) => {
            submitEvent.preventDefault();
            events.handleContinue();
          }}
        >
          <Checkbox
            id="saved-codes"
            name="savedCodes"
            label="I’ve saved these codes somewhere safe"
            checked={states.hasSavedCodes}
            onChange={(changeEvent) => events.handleChangeSavedCodes(changeEvent.target.checked)}
          />
          <Button type="submit" size="lg" className="w-full" disabled={!states.hasSavedCodes}>
            Continue to DaiBX
          </Button>
        </form>
      </div>
    </AuthFrame>
  );
};

export default RecoveryCodesPage;
