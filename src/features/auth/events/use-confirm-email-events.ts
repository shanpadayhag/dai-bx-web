import { useCallback, useRef } from 'react';
import AppError from '@/core/app-error';
import confirmEmailChange from '@/features/auth/actions/confirm-email-change';
import {
  readEmailLinkToken,
  removeEmailLinkTokenFromAddress,
} from '@/features/auth/entities/email-link-token';
import type useConfirmEmailStates from '@/features/auth/states/use-confirm-email-states';

const useConfirmEmailEvents = (states: ReturnType<typeof useConfirmEmailStates>) => {
  const { setConfirmEmailStatus, setConfirmError } = states;
  const hasSubmittedLinkRef = useRef(false);

  const handleOpenLink = useCallback(async () => {
    if (hasSubmittedLinkRef.current) return;
    const linkToken = readEmailLinkToken(window.location);
    if (linkToken === null || linkToken.trim() === '') {
      setConfirmEmailStatus('missing_token');
      return;
    }
    hasSubmittedLinkRef.current = true;
    removeEmailLinkTokenFromAddress();
    try {
      await confirmEmailChange({ linkToken });
      setConfirmEmailStatus('confirmed');
    } catch (confirmLinkError) {
      if (!(confirmLinkError instanceof AppError)) throw confirmLinkError;
      setConfirmError(confirmLinkError);
      setConfirmEmailStatus('failed');
    }
  }, [setConfirmEmailStatus, setConfirmError]);

  return { handleOpenLink };
};

export default useConfirmEmailEvents;
