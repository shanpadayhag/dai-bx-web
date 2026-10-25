import { LogOut, MonitorSmartphone } from 'lucide-react';
import type { FormEvent } from 'react';
import Button from '@/core/components/atoms/button';
import Field from '@/core/components/molecules/field';
import PasswordInput from '@/core/components/molecules/password-input';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import {
  describeLastActive,
  describeSessionDevice,
  type AccountSession,
} from '@/features/settings/entities/account-session';

export const SESSIONS_DIALOG_ID = 'sessions-dialog';
export const END_ALL_SESSIONS_INTENT = 'end-all';

type SessionsDialogProps = {
  accountSessions: readonly AccountSession[];
  currentTime: Date;
  isSubmitting: boolean;
  onSubmit: (submitEvent: FormEvent<HTMLFormElement>) => void;
};

const SessionsDialog = ({
  accountSessions,
  currentTime,
  isSubmitting,
  onSubmit,
}: SessionsDialogProps) => (
  <PopoverPanel id={SESSIONS_DIALOG_ID} label="Signed-in devices">
    <form className="grid gap-5 p-5 sm:p-6" onSubmit={onSubmit}>
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground [&_svg]:size-5">
        <MonitorSmartphone />
      </span>
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-foreground">Signed-in devices</h2>
        <p className="text-sm text-muted-foreground">
          End any device you don’t recognise. Signing out everywhere also forgets remembered
          devices.
        </p>
      </div>
      <ul className="grid gap-2">
        {accountSessions.map((accountSession) => {
          const deviceLabel = describeSessionDevice(accountSession.userAgent);
          return (
            <li
              key={accountSession.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
            >
              <div className="grid min-w-0 gap-0.5">
                <span className="truncate text-sm font-medium text-foreground">{deviceLabel}</span>
                <span className="text-xs text-muted-foreground">
                  {accountSession.isCurrent
                    ? 'This device'
                    : describeLastActive(accountSession.lastSeenAt, currentTime)}
                </span>
              </div>
              {accountSession.isCurrent ? null : (
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  name="intent"
                  value={accountSession.id}
                  aria-label={`End ${deviceLabel}`}
                  disabled={isSubmitting}
                >
                  End
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <Field
        label="Your password"
        htmlFor="sessions-password"
        hint="Needed to end a device or sign out everywhere."
      >
        <PasswordInput id="sessions-password" name="password" autoComplete="current-password" />
      </Field>
      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="ghost" popoverTarget={SESSIONS_DIALOG_ID} popoverTargetAction="hide">
          Close
        </Button>
        <Button
          type="submit"
          variant="danger"
          name="intent"
          value={END_ALL_SESSIONS_INTENT}
          disabled={isSubmitting}
        >
          <LogOut />
          Sign out everywhere
        </Button>
      </div>
    </form>
  </PopoverPanel>
);

export default SessionsDialog;
