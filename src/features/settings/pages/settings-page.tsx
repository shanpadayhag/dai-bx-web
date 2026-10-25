'use client';

import { RotateCw, WifiOff } from 'lucide-react';
import { useEffect } from 'react';
import type { ThemeMode } from '@/core/appearance';
import Badge from '@/core/components/atoms/badge';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Switch from '@/core/components/atoms/switch';
import EmptyState from '@/core/components/molecules/empty-state';
import Field from '@/core/components/molecules/field';
import PageHeader from '@/core/components/molecules/page-header';
import SegmentedControl from '@/core/components/molecules/segmented-control';
import AccentPicker from '@/features/settings/components/accent-picker';
import CategoryList from '@/features/settings/components/category-list';
import ChangeEmailDialog from '@/features/settings/components/change-email-dialog';
import ChangePasswordDialog from '@/features/settings/components/change-password-dialog';
import DeleteAccountDialog from '@/features/settings/components/delete-account-dialog';
import DeleteCategoryDialog from '@/features/settings/components/delete-category-dialog';
import NewRecoveryCodesDialog from '@/features/settings/components/new-recovery-codes-dialog';
import ReplaceAuthenticatorDialog from '@/features/settings/components/replace-authenticator-dialog';
import SessionsDialog, { SESSIONS_DIALOG_ID } from '@/features/settings/components/sessions-dialog';
import sampleCategorySource from '@/features/settings/data_sources/sample/category-source';
import SettingRow from '@/features/settings/components/setting-row';
import SettingsSection from '@/features/settings/components/settings-section';
import { LOW_RECOVERY_CODE_COUNT, RECOVERY_CODE_TOTAL } from '@/features/settings/entities/account';
import useSettingsEvents from '@/features/settings/events/use-settings-events';
import useSettingsStates from '@/features/settings/states/use-settings-states';

const themeOptions: readonly { label: string; theme: ThemeMode }[] = [
  { label: 'System', theme: 'system' },
  { label: 'Light', theme: 'light' },
  { label: 'Dark', theme: 'dark' },
];

const describeDeviceCount = (activeSessionCount: number) =>
  `${activeSessionCount} device${activeSessionCount === 1 ? '' : 's'}`;

const SettingsPage = () => {
  const states = useSettingsStates();
  const events = useSettingsEvents(states);
  const { handleLoadAccount } = events;

  useEffect(() => {
    void handleLoadAccount();
  }, [handleLoadAccount]);

  const header = (
    <PageHeader
      title="Settings"
      description="Your profile, how DaiBX looks, and how it tracks time."
    />
  );

  if (states.account === null) {
    return (
      <div className="mx-auto grid max-w-4xl gap-8">
        {header}
        {states.accountLoadError === null ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading your settings…
          </p>
        ) : (
          <EmptyState
            icon={<WifiOff />}
            title={states.accountLoadError.title}
            description={states.accountLoadError.description}
            action={
              <Button variant="secondary" onClick={() => void handleLoadAccount()}>
                <RotateCw />
                Try again
              </Button>
            }
          />
        )}
      </div>
    );
  }

  const account = states.account;
  const hasFewRecoveryCodes = account.security.recoveryCodesRemaining <= LOW_RECOVERY_CODE_COUNT;
  const selectedThemeLabel =
    themeOptions.find((themeOption) => themeOption.theme === account.theme)?.label ?? 'System';

  return (
    <div className="mx-auto grid max-w-4xl gap-8">
      {header}
      <div className="rounded-2xl border border-border bg-background px-5 py-8 shadow-soft sm:px-8">
        <SettingsSection
          title="Profile"
          description="Shown on your workspace and in shared boards."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="profile-name">
              <Input
                key={account.name}
                id="profile-name"
                name="name"
                autoComplete="name"
                defaultValue={account.name}
                onBlur={(blurEvent) => void events.handleSaveName(blurEvent.currentTarget.value)}
                onKeyDown={(keyEvent) => {
                  if (keyEvent.key === 'Enter') keyEvent.currentTarget.blur();
                }}
              />
            </Field>
          </div>
        </SettingsSection>
        <SettingsSection
          title="Security"
          description="How you sign in, and what to do if you lose a device. Changes here ask for your password and a code."
        >
          <SettingRow
            title="Email"
            description={`${account.email}. Sign-in links and resets go here.`}
            control={
              <Button variant="secondary" size="sm" popoverTarget="change-email-dialog">
                Change
              </Button>
            }
          />
          <SettingRow
            title="Password"
            description="Changing it signs out your other devices."
            control={
              <Button variant="secondary" size="sm" popoverTarget="change-password-dialog">
                Change
              </Button>
            }
          />
          <SettingRow
            title="Authenticator app"
            description="Every sign-in asks for its code unless the device is remembered."
            control={
              <Button variant="secondary" size="sm" popoverTarget="replace-authenticator-dialog">
                Replace
              </Button>
            }
          />
          <SettingRow
            title={
              <>
                Recovery codes
                <Badge tone={hasFewRecoveryCodes ? 'warning' : 'neutral'} className="tabular-nums">
                  {account.security.recoveryCodesRemaining} of {RECOVERY_CODE_TOTAL} left
                </Badge>
              </>
            }
            description="Each signs you in once if you lose your phone."
            control={
              <Button variant="secondary" size="sm" popoverTarget="new-recovery-codes-dialog">
                New codes
              </Button>
            }
          />
          <SettingRow
            title="Signed-in devices"
            description={`You’re signed in on ${describeDeviceCount(account.security.activeSessionCount)}. See each one, end any you don’t recognise, or sign out everywhere.`}
            control={
              <Button variant="secondary" size="sm" popoverTarget={SESSIONS_DIALOG_ID}>
                Manage
              </Button>
            }
          />
        </SettingsSection>
        <SettingsSection
          title="Appearance"
          description="Blue is the default. The accent colors buttons, selection and tracked events."
        >
          <AccentPicker
            selectedAccentColor={account.accentColor}
            onSelectAccentColor={events.handleChooseAccentColor}
          />
          <SettingRow
            title="Mode"
            description="System follows your device."
            control={
              <SegmentedControl
                label="Color mode"
                options={themeOptions.map((themeOption) => themeOption.label)}
                selectedOption={selectedThemeLabel}
                onSelectOption={(chosenLabel) => {
                  const chosenTheme = themeOptions.find(
                    (themeOption) => themeOption.label === chosenLabel,
                  )?.theme;
                  if (chosenTheme !== undefined) events.handleChooseTheme(chosenTheme);
                }}
              />
            }
          />
        </SettingsSection>
        <SettingsSection
          title="Categories"
          description="Make as many as you need, in any color. Every group, card, event and workflow can belong to one, and its color follows it into the calendar."
        >
          <CategoryList categories={sampleCategorySource.findAll()} />
        </SettingsSection>
        <SettingsSection
          title="Time tracking"
          description="Starting a task creates a calendar event. Finishing it sets the end."
        >
          <SettingRow
            title="Check in on running tasks"
            description="A notification asks if you’re still on it once a task passes its estimate."
            control={<Switch isOn label="Check in on running tasks" />}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Check in every"
              htmlFor="check-in-interval"
              hint="After the first check-in, this repeats until you finish."
            >
              <Input id="check-in-interval" defaultValue="30 min" className="font-mono" />
            </Field>
            <Field
              label="First check-in with no estimate"
              htmlFor="first-check-in"
              hint="Used when a task has no estimate."
            >
              <Input id="first-check-in" defaultValue="30 min" className="font-mono" />
            </Field>
          </div>
          <SettingRow
            title="Suggest my last check-in as the end"
            description="When a check-in went unanswered, finishing suggests the last time you confirmed."
            control={<Switch isOn label="Suggest my last check-in as the end" />}
          />
        </SettingsSection>
        <SettingsSection
          title="Working hours"
          description="The calendar opens on these hours and the planner fills them first."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Day starts" htmlFor="day-starts">
              <Input id="day-starts" type="time" defaultValue="16:00" />
            </Field>
            <Field label="Day ends" htmlFor="day-ends" hint="Past midnight counts as the same day.">
              <Input id="day-ends" type="time" defaultValue="02:00" />
            </Field>
          </div>
        </SettingsSection>
        <SettingsSection
          title="Account"
          description="Sign out of this device, or erase the account and everything in it."
        >
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={states.isSigningOut}
              onClick={() => void events.handleSignOut()}
            >
              Sign out
            </Button>
            <Button
              variant="ghost"
              className="text-danger hover:bg-danger-soft hover:text-danger"
              popoverTarget="delete-account-dialog"
            >
              Delete account
            </Button>
          </div>
        </SettingsSection>
      </div>
      <DeleteCategoryDialog />
      <ChangeEmailDialog
        isSubmitting={states.submittingDialogId === 'change-email-dialog'}
        onSubmit={(submitEvent) => void events.handleChangeEmail(submitEvent)}
      />
      <ChangePasswordDialog
        isSubmitting={states.submittingDialogId === 'change-password-dialog'}
        onSubmit={(submitEvent) => void events.handleChangePassword(submitEvent)}
      />
      <ReplaceAuthenticatorDialog
        replacementSetup={states.replacementSetup}
        isSubmitting={states.submittingDialogId === 'replace-authenticator-dialog'}
        onSubmitIdentity={(submitEvent) =>
          void events.handleStartAuthenticatorReplacement(submitEvent)
        }
        onSubmitNewCode={(submitEvent) =>
          void events.handleConfirmAuthenticatorReplacement(submitEvent)
        }
      />
      <NewRecoveryCodesDialog
        newRecoveryCodes={states.newRecoveryCodes}
        isSubmitting={states.submittingDialogId === 'new-recovery-codes-dialog'}
        onSubmit={(submitEvent) => void events.handleRegenerateRecoveryCodes(submitEvent)}
        onCopyCodes={() => void events.handleCopyNewRecoveryCodes()}
        onDone={events.handleFinishNewRecoveryCodes}
      />
      <SessionsDialog
        accountSessions={states.accountSessions}
        currentTime={new Date()}
        isSubmitting={states.submittingDialogId === SESSIONS_DIALOG_ID}
        onSubmit={(submitEvent) => void events.handleSubmitSessions(submitEvent)}
      />
      <DeleteAccountDialog
        isSubmitting={states.submittingDialogId === 'delete-account-dialog'}
        onSubmit={(submitEvent) => void events.handleDeleteAccount(submitEvent)}
      />
    </div>
  );
};

export default SettingsPage;
