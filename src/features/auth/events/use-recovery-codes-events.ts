import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';
import findShownRecoveryCodes from '@/features/auth/actions/find-shown-recovery-codes';
import forgetShownRecoveryCodes from '@/features/auth/actions/forget-shown-recovery-codes';
import { APP_HOME_PATH } from '@/features/auth/entities/return-path';
import type useRecoveryCodesStates from '@/features/auth/states/use-recovery-codes-states';

const RECOVERY_CODES_FILE_NAME = 'daibx-recovery-codes.txt';

const useRecoveryCodesEvents = (states: ReturnType<typeof useRecoveryCodesStates>) => {
  const { recoveryCodes, setRecoveryCodes, setRecoveryCodesStatus, setHasSavedCodes } = states;
  const router = useRouter();

  const handleLoadCodes = useCallback(() => {
    const shownRecoveryCodes = findShownRecoveryCodes();
    setRecoveryCodes(shownRecoveryCodes);
    setRecoveryCodesStatus(shownRecoveryCodes.length === 0 ? 'already_shown' : 'showing');
  }, [setRecoveryCodes, setRecoveryCodesStatus]);

  const handleCopyCodes = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      toast.success('Codes copied', { description: 'Paste them into your password manager.' });
    } catch {
      toast.error('Couldn’t copy', { description: 'Download them, or copy them by hand.' });
    }
  }, [recoveryCodes]);

  const handleDownloadCodes = useCallback(() => {
    const codesFileUrl = URL.createObjectURL(
      new Blob([`DaiBX recovery codes\n\n${recoveryCodes.join('\n')}\n`], { type: 'text/plain' }),
    );
    const downloadLink = document.createElement('a');
    downloadLink.href = codesFileUrl;
    downloadLink.download = RECOVERY_CODES_FILE_NAME;
    downloadLink.click();
    URL.revokeObjectURL(codesFileUrl);
  }, [recoveryCodes]);

  const handleChangeSavedCodes = useCallback(
    (isChecked: boolean) => setHasSavedCodes(isChecked),
    [setHasSavedCodes],
  );

  const handleContinue = useCallback(() => {
    forgetShownRecoveryCodes();
    router.replace(APP_HOME_PATH);
  }, [router]);

  return {
    handleLoadCodes,
    handleCopyCodes,
    handleDownloadCodes,
    handleChangeSavedCodes,
    handleContinue,
  };
};

export default useRecoveryCodesEvents;
