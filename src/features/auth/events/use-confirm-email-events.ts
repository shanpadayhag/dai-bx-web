import { useCallback, useRef } from 'react';
import AppError from '@/core/app-error';
import confirmEmailChange from '@/features/auth/actions/confirm-email-change';
import type useConfirmEmailStates from '@/features/auth/states/use-confirm-email-states';

const useConfirmEmailEvents = (states: ReturnType<typeof useConfirmEmailStates>) => {
  const { setConfirmEmailStatus, setConfirmError } = states;
  const hasSubmittedLinkRef = useRef(false);

  const handleOpenLink = useCallback(async () => {
    const linkToken = new URLSearchParams(window.location.search).get('token');
    if (linkToken === null || linkToken.trim() === '') {
      setConfirmEmailStatus('missing_token');
      return;
    }
    if (hasSubmittedLinkRef.current) return;
    hasSubmittedLinkRef.current = true;
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
