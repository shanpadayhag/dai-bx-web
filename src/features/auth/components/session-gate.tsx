'use client';

import { useEffect, type ReactNode } from 'react';
import { SIGNED_OUT_EVENT_NAME } from '@/core/api/api-error';
import { PROFILE_CHANGED_EVENT_NAME } from '@/core/profile-change';
import SessionCheckScreen from '@/features/auth/components/session-check-screen';
import useSessionGateEvents from '@/features/auth/events/use-session-gate-events';
import { SignedInUserContext } from '@/features/auth/states/signed-in-user-context';
import useSessionGateStates from '@/features/auth/states/use-session-gate-states';

type SessionGateProps = {
  children: ReactNode;
};

const SessionGate = ({ children }: SessionGateProps) => {
  const states = useSessionGateStates();
  const events = useSessionGateEvents(states);
  const { handleCheckSession, handleSignedOut, handleProfileChanged } = events;

  useEffect(() => {
    window.addEventListener(SIGNED_OUT_EVENT_NAME, handleSignedOut);
    return () => window.removeEventListener(SIGNED_OUT_EVENT_NAME, handleSignedOut);
  }, [handleSignedOut]);

  useEffect(() => {
    window.addEventListener(PROFILE_CHANGED_EVENT_NAME, handleProfileChanged);
    return () => window.removeEventListener(PROFILE_CHANGED_EVENT_NAME, handleProfileChanged);
  }, [handleProfileChanged]);

  useEffect(() => {
    void handleCheckSession();
  }, [handleCheckSession]);

  if (states.sessionCheckStatus === 'signed_in') {
    return (
      <SignedInUserContext.Provider value={states.signedInUser}>
        {children}
      </SignedInUserContext.Provider>
    );
  }
  return (
    <SessionCheckScreen
      sessionCheckError={states.sessionCheckStatus === 'failed' ? states.sessionCheckError : null}
      onRetry={() => void handleCheckSession()}
    />
  );
};

export default SessionGate;
