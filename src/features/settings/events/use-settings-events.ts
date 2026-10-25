import { useRouter } from 'next/navigation';
import { useCallback, type FormEvent } from 'react';
import { toast } from 'sonner';
import AppError from '@/core/app-error';
import {
  applyAppearance,
  forgetAppearance,
  readAppliedAppearance,
  type AccentColor,
  type Appearance,
  type ThemeMode,
} from '@/core/appearance';
import readFormText from '@/core/form-text';
import hidePopover from '@/core/popover';
import reportAppError from '@/core/report-app-error';
import signOut from '@/features/auth/actions/sign-out';
import signOutEverywhere from '@/features/auth/actions/sign-out-everywhere';
import changePassword from '@/features/settings/actions/change-password';
import confirmAuthenticatorReplacement from '@/features/settings/actions/confirm-authenticator-replacement';
import deleteAccount from '@/features/settings/actions/delete-account';
import findAccount from '@/features/settings/actions/find-account';
import regenerateRecoveryCodes from '@/features/settings/actions/regenerate-recovery-codes';
import requestEmailChange from '@/features/settings/actions/request-email-change';
import startAuthenticatorReplacement from '@/features/settings/actions/start-authenticator-replacement';
import updateProfile from '@/features/settings/actions/update-profile';
import { CHANGE_EMAIL_DIALOG_ID } from '@/features/settings/components/change-email-dialog';
import { CHANGE_PASSWORD_DIALOG_ID } from '@/features/settings/components/change-password-dialog';
import { NEW_RECOVERY_CODES_DIALOG_ID } from '@/features/settings/components/new-recovery-codes-dialog';
import { REPLACE_AUTHENTICATOR_DIALOG_ID } from '@/features/settings/components/replace-authenticator-dialog';
import type { IdentityProof, ProfileChanges } from '@/features/settings/entities/account';
import type useSettingsStates from '@/features/settings/states/use-settings-states';

const SIGN_IN_PATH = '/sign-in';
const MARKETING_HOME_PATH = '/';
const SIGN_OUT_EVERYWHERE_DIALOG_ID = 'sign-out-everywhere-dialog';
const DELETE_ACCOUNT_DIALOG_ID = 'delete-account-dialog';

const readIdentityProof = (submittedForm: FormData): IdentityProof => ({
  password: readFormText(submittedForm, 'password'),
  code: readFormText(submittedForm, 'code').trim(),
});

const pickAppearanceChanges = (profileChanges: ProfileChanges): Partial<Appearance> => ({
  ...(profileChanges.accentColor === undefined ? {} : { accentColor: profileChanges.accentColor }),
  ...(profileChanges.theme === undefined ? {} : { theme: profileChanges.theme }),
});

const useSettingsEvents = (states: ReturnType<typeof useSettingsStates>) => {
  const {
    account,
    newRecoveryCodes,
    setAccount,
    setAccountLoadError,
    setSubmittingDialogId,
    setNewRecoveryCodes,
    setReplacementSetup,
    setIsSigningOut,
  } = states;
  const router = useRouter();

  const handleLoadAccount = useCallback(async () => {
    setAccountLoadError(null);
    try {
      setAccount(await findAccount());
    } catch (accountError) {
      if (!(accountError instanceof AppError)) throw accountError;
      setAccountLoadError(accountError);
    }
  }, [setAccount, setAccountLoadError]);

  const saveProfileChanges = useCallback(
    async (profileChanges: ProfileChanges) => {
      const previousAppearance = readAppliedAppearance();
      const previousName = account?.name;
      setAccount((currentAccount) =>
        currentAccount === null ? currentAccount : { ...currentAccount, ...profileChanges },
      );
      applyAppearance({ ...previousAppearance, ...pickAppearanceChanges(profileChanges) });
      try {
        const savedProfile = await updateProfile({ profileChanges });
        setAccount((currentAccount) =>
          currentAccount === null ? currentAccount : { ...currentAccount, ...savedProfile },
        );
        applyAppearance(savedProfile);
        return true;
      } catch (profileError) {
        setAccount((currentAccount) =>
          currentAccount === null
            ? currentAccount
            : {
                ...currentAccount,
                ...previousAppearance,
                name: previousName ?? currentAccount.name,
              },
        );
        applyAppearance(previousAppearance);
        reportAppError(profileError);
        return false;
      }
    },
    [account, setAccount],
  );

  const handleChooseAccentColor = useCallback(
    (accentColor: AccentColor) => {
      if (account?.accentColor === accentColor) return;
      void saveProfileChanges({ accentColor });
    },
    [account, saveProfileChanges],
  );

  const handleChooseTheme = useCallback(
    (theme: ThemeMode) => {
      if (account?.theme === theme) return;
      void saveProfileChanges({ theme });
    },
    [account, saveProfileChanges],
  );

  const handleSaveName = useCallback(
    async (enteredName: string) => {
      const trimmedName = enteredName.trim();
      if (account === null || trimmedName === account.name) return;
      const isSaved = await saveProfileChanges({ name: trimmedName });
      if (isSaved) toast.success('Name saved');
    },
    [account, saveProfileChanges],
  );

  const submitDialog = useCallback(
    async (
      submitEvent: FormEvent<HTMLFormElement>,
      dialogId: string,
      submitAction: (submittedForm: FormData) => Promise<void>,
    ) => {
      submitEvent.preventDefault();
      const submittedFormElement = submitEvent.currentTarget;
      setSubmittingDialogId(dialogId);
      try {
        await submitAction(new FormData(submittedFormElement));
        submittedFormElement.reset();
      } catch (dialogError) {
        reportAppError(dialogError);
      } finally {
        setSubmittingDialogId(null);
      }
    },
    [setSubmittingDialogId],
  );

  const handleChangePassword = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) =>
      submitDialog(submitEvent, CHANGE_PASSWORD_DIALOG_ID, async (submittedForm) => {
        await changePassword({
          currentPassword: readFormText(submittedForm, 'currentPassword'),
          newPassword: readFormText(submittedForm, 'newPassword'),
        });
        hidePopover(CHANGE_PASSWORD_DIALOG_ID);
        toast.success('Password changed', { description: 'Your other devices are signed out.' });
        await handleLoadAccount();
      }),
    [handleLoadAccount, submitDialog],
  );

  const handleChangeEmail = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) =>
      submitDialog(submitEvent, CHANGE_EMAIL_DIALOG_ID, async (submittedForm) => {
        const newEmail = await requestEmailChange({
          identityProof: readIdentityProof(submittedForm),
          newEmail: readFormText(submittedForm, 'newEmail'),
        });
        hidePopover(CHANGE_EMAIL_DIALOG_ID);
        toast.success(`Check ${newEmail}`, {
          description: 'Open the link there to finish the change. It works for 24 hours.',
        });
      }),
    [submitDialog],
  );

  const handleRegenerateRecoveryCodes = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) =>
      submitDialog(submitEvent, NEW_RECOVERY_CODES_DIALOG_ID, async (submittedForm) => {
        setNewRecoveryCodes(
          await regenerateRecoveryCodes({ identityProof: readIdentityProof(submittedForm) }),
        );
        await handleLoadAccount();
      }),
    [handleLoadAccount, setNewRecoveryCodes, submitDialog],
  );

  const handleCopyNewRecoveryCodes = useCallback(async () => {
    if (newRecoveryCodes === null) return;
    try {
      await navigator.clipboard.writeText(newRecoveryCodes.join('\n'));
      toast.success('Codes copied', { description: 'Paste them into your password manager.' });
    } catch {
      toast.error('Couldn’t copy', { description: 'Copy them by hand before closing.' });
    }
  }, [newRecoveryCodes]);

  const handleFinishNewRecoveryCodes = useCallback(() => {
    hidePopover(NEW_RECOVERY_CODES_DIALOG_ID);
    setNewRecoveryCodes(null);
  }, [setNewRecoveryCodes]);

  const handleStartAuthenticatorReplacement = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) =>
      submitDialog(submitEvent, REPLACE_AUTHENTICATOR_DIALOG_ID, async (submittedForm) => {
        setReplacementSetup(
          await startAuthenticatorReplacement({ identityProof: readIdentityProof(submittedForm) }),
        );
      }),
    [setReplacementSetup, submitDialog],
  );

  const handleConfirmAuthenticatorReplacement = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) =>
      submitDialog(submitEvent, REPLACE_AUTHENTICATOR_DIALOG_ID, async (submittedForm) => {
        await confirmAuthenticatorReplacement({ code: readFormText(submittedForm, 'code') });
        hidePopover(REPLACE_AUTHENTICATOR_DIALOG_ID);
        setReplacementSetup(null);
        toast.success('Authenticator replaced', {
          description: 'Your other devices are signed out and remembered devices forgotten.',
        });
        await handleLoadAccount();
      }),
    [handleLoadAccount, setReplacementSetup, submitDialog],
  );

  const leaveSignedOut = useCallback(
    (destinationPath: string) => {
      forgetAppearance();
      router.replace(destinationPath);
    },
    [router],
  );

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      leaveSignedOut(SIGN_IN_PATH);
    } catch (signOutError) {
      reportAppError(signOutError);
      setIsSigningOut(false);
    }
  }, [leaveSignedOut, setIsSigningOut]);

  const handleSignOutEverywhere = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) =>
      submitDialog(submitEvent, SIGN_OUT_EVERYWHERE_DIALOG_ID, async () => {
        await signOutEverywhere();
        hidePopover(SIGN_OUT_EVERYWHERE_DIALOG_ID);
        leaveSignedOut(SIGN_IN_PATH);
      }),
    [leaveSignedOut, submitDialog],
  );

  const handleDeleteAccount = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) =>
      submitDialog(submitEvent, DELETE_ACCOUNT_DIALOG_ID, async (submittedForm) => {
        await deleteAccount({
          identityProof: readIdentityProof(submittedForm),
          confirmation: readFormText(submittedForm, 'confirmation'),
        });
        hidePopover(DELETE_ACCOUNT_DIALOG_ID);
        leaveSignedOut(MARKETING_HOME_PATH);
      }),
    [leaveSignedOut, submitDialog],
  );

  return {
    handleLoadAccount,
    handleChooseAccentColor,
    handleChooseTheme,
    handleSaveName,
    handleChangePassword,
    handleChangeEmail,
    handleRegenerateRecoveryCodes,
    handleCopyNewRecoveryCodes,
    handleFinishNewRecoveryCodes,
    handleStartAuthenticatorReplacement,
    handleConfirmAuthenticatorReplacement,
    handleSignOut,
    handleSignOutEverywhere,
    handleDeleteAccount,
  };
};

export default useSettingsEvents;
