'use client';

import { useEffect, type ReactNode } from 'react';
import { SIGNED_OUT_EVENT_NAME } from '@/core/api/api-error';
import SessionCheckScreen from '@/features/auth/components/session-check-screen';
import useSessionGateEvents from '@/features/auth/events/use-session-gate-events';
import useSessionGateStates from '@/features/auth/states/use-session-gate-states';

type SessionGateProps = {
  children: ReactNode;
};

const SessionGate = ({ children }: SessionGateProps) => {
  const states = useSessionGateStates();
  const events = useSessionGateEvents(states);
  const { handleCheckSession, handleSignedOut } = events;

  useEffect(() => {
    window.addEventListener(SIGNED_OUT_EVENT_NAME, handleSignedOut);
    return () => window.removeEventListener(SIGNED_OUT_EVENT_NAME, handleSignedOut);
  }, [handleSignedOut]);

  useEffect(() => {
    void handleCheckSession();
  }, [handleCheckSession]);

  if (states.sessionCheckStatus === 'signed_in') return children;
  return (
    <SessionCheckScreen
      sessionCheckError={states.sessionCheckStatus === 'failed' ? states.sessionCheckError : null}
      onRetry={() => void handleCheckSession()}
    />
  );
};

export default SessionGate;
