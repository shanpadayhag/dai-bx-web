import { useRouter } from 'next/navigation';
import { useCallback, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/core/api/api-error';
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
import { announceProfileChange } from '@/core/profile-change';
import reportAppError from '@/core/report-app-error';
import signOut from '@/features/auth/actions/sign-out';
import createCategory from '@/features/categories/actions/create-category';
import deleteCategory from '@/features/categories/actions/delete-category';
import findCategories from '@/features/categories/actions/find-categories';
import updateCategory from '@/features/categories/actions/update-category';
import changePassword from '@/features/settings/actions/change-password';
import confirmAuthenticatorReplacement from '@/features/settings/actions/confirm-authenticator-replacement';
import deleteAccount from '@/features/settings/actions/delete-account';
import endAllSessions from '@/features/settings/actions/end-all-sessions';
import endOtherSession from '@/features/settings/actions/end-other-session';
import findAccount from '@/features/settings/actions/find-account';
import findAccountSessions from '@/features/settings/actions/find-account-sessions';
import regenerateRecoveryCodes from '@/features/settings/actions/regenerate-recovery-codes';
import requestEmailChange from '@/features/settings/actions/request-email-change';
import startAuthenticatorReplacement from '@/features/settings/actions/start-authenticator-replacement';
import updateProfile from '@/features/settings/actions/update-profile';
import { NEW_CATEGORY_ERROR_KEY } from '@/features/settings/components/category-list';
import { CHANGE_EMAIL_DIALOG_ID } from '@/features/settings/components/change-email-dialog';
import { CHANGE_PASSWORD_DIALOG_ID } from '@/features/settings/components/change-password-dialog';
import { DELETE_CATEGORY_DIALOG_ID } from '@/features/settings/components/delete-category-dialog';
import { NEW_RECOVERY_CODES_DIALOG_ID } from '@/features/settings/components/new-recovery-codes-dialog';
import { REPLACE_AUTHENTICATOR_DIALOG_ID } from '@/features/settings/components/replace-authenticator-dialog';
import {
  END_ALL_SESSIONS_INTENT,
  SESSIONS_DIALOG_ID,
} from '@/features/settings/components/sessions-dialog';
import type { IdentityProof, ProfileChanges } from '@/features/settings/entities/account';
import type useSettingsStates from '@/features/settings/states/use-settings-states';

const SIGN_IN_PATH = '/sign-in';
const MARKETING_HOME_PATH = '/';
const DELETE_ACCOUNT_DIALOG_ID = 'delete-account-dialog';

const readIdentityProof = (submittedForm: FormData): IdentityProof => ({
  password: readFormText(submittedForm, 'password'),
  code: readFormText(submittedForm, 'code').trim(),
});

const FIELD_PROBLEM_STATUSES: readonly number[] = [409, 422];

const isFieldProblem = (categoryError: unknown): categoryError is AppError =>
  categoryError instanceof ApiError
    ? FIELD_PROBLEM_STATUSES.includes(categoryError.status)
    : categoryError instanceof AppError;

const withoutKey = (fieldErrors: Readonly<Record<string, string>>, removedKey: string) =>
  Object.fromEntries(Object.entries(fieldErrors).filter(([errorKey]) => errorKey !== removedKey));

const pickAppearanceChanges = (profileChanges: ProfileChanges): Partial<Appearance> => ({
  ...(profileChanges.accentColor === undefined ? {} : { accentColor: profileChanges.accentColor }),
  ...(profileChanges.theme === undefined ? {} : { theme: profileChanges.theme }),
});

const useSettingsEvents = (states: ReturnType<typeof useSettingsStates>) => {
  const {
    account,
    newRecoveryCodes,
    setAccount,
    setAccountSessions,
    setAccountLoadError,
    setSubmittingDialogId,
    setNewRecoveryCodes,
    setReplacementSetup,
    setIsSigningOut,
    categories,
    deleteTargetCategoryId,
    newCategoryColor,
    setCategories,
    setCategoryNameErrors,
    setNewCategoryColor,
    setIsAddingCategory,
    setDeleteTargetCategoryId,
  } = states;
  const router = useRouter();

  const handleLoadAccount = useCallback(async () => {
    setAccountLoadError(null);
    try {
      const [loadedAccount, loadedSessions, loadedCategories] = await Promise.all([
        findAccount(),
        findAccountSessions(),
        findCategories(),
      ]);
      setAccount(loadedAccount);
      setAccountSessions(loadedSessions);
      setCategories(loadedCategories);
    } catch (accountError) {
      if (!(accountError instanceof AppError)) throw accountError;
      setAccountLoadError(accountError);
    }
  }, [setAccount, setAccountSessions, setAccountLoadError, setCategories]);

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
      if (!isSaved) return;
      announceProfileChange({ name: trimmedName });
      toast.success('Name saved');
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

  const handleSubmitSessions = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) => {
      const submitterElement =
        submitEvent.nativeEvent instanceof SubmitEvent ? submitEvent.nativeEvent.submitter : null;
      const submittedIntent =
        submitterElement instanceof HTMLButtonElement ? submitterElement.value : '';
      return submitDialog(submitEvent, SESSIONS_DIALOG_ID, async (submittedForm) => {
        const password = readFormText(submittedForm, 'password');
        if (submittedIntent === END_ALL_SESSIONS_INTENT) {
          await endAllSessions({ password });
          hidePopover(SESSIONS_DIALOG_ID);
          leaveSignedOut(SIGN_IN_PATH);
          return;
        }
        await endOtherSession({ sessionId: submittedIntent, password });
        toast.success('Device signed out', {
          description: 'It needs your password and a code to sign in again.',
        });
        await handleLoadAccount();
      });
    },
    [handleLoadAccount, leaveSignedOut, submitDialog],
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

  const showCategoryFieldError = useCallback(
    (errorKey: string, categoryError: unknown) => {
      if (!isFieldProblem(categoryError)) {
        reportAppError(categoryError);
        return;
      }
      setCategoryNameErrors((currentErrors) => ({
        ...currentErrors,
        [errorKey]: categoryError.description,
      }));
    },
    [setCategoryNameErrors],
  );

  const handleRenameCategory = useCallback(
    async (categoryId: string, enteredName: string) => {
      const currentCategory = categories.find((category) => category.id === categoryId);
      if (currentCategory === undefined || enteredName.trim() === currentCategory.name) {
        setCategoryNameErrors((currentErrors) => withoutKey(currentErrors, categoryId));
        return;
      }
      try {
        const renamedCategory = await updateCategory({
          categoryId,
          categoryChanges: { name: enteredName },
        });
        setCategories((currentCategories) =>
          currentCategories.map((category) =>
            category.id === categoryId ? renamedCategory : category,
          ),
        );
        setCategoryNameErrors((currentErrors) => withoutKey(currentErrors, categoryId));
      } catch (renameError) {
        showCategoryFieldError(categoryId, renameError);
      }
    },
    [categories, setCategories, setCategoryNameErrors, showCategoryFieldError],
  );

  const handleRecolorCategory = useCallback(
    async (categoryId: string, chosenColor: string) => {
      const previousCategory = categories.find((category) => category.id === categoryId);
      if (previousCategory === undefined || previousCategory.color === chosenColor) return;
      const replaceCategory = (replacementCategory: (typeof categories)[number]) =>
        setCategories((currentCategories) =>
          currentCategories.map((category) =>
            category.id === categoryId ? replacementCategory : category,
          ),
        );
      replaceCategory({ ...previousCategory, color: chosenColor });
      try {
        replaceCategory(
          await updateCategory({ categoryId, categoryChanges: { color: chosenColor } }),
        );
      } catch (recolorError) {
        replaceCategory(previousCategory);
        reportAppError(recolorError);
      }
    },
    [categories, setCategories],
  );

  const handleAddCategory = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const addCategoryForm = submitEvent.currentTarget;
      setIsAddingCategory(true);
      try {
        const createdCategory = await createCategory({
          categoryName: readFormText(new FormData(addCategoryForm), 'categoryName'),
          categoryColor: newCategoryColor,
        });
        setCategories((currentCategories) => [...currentCategories, createdCategory]);
        setCategoryNameErrors((currentErrors) => withoutKey(currentErrors, NEW_CATEGORY_ERROR_KEY));
        addCategoryForm.reset();
      } catch (addError) {
        showCategoryFieldError(NEW_CATEGORY_ERROR_KEY, addError);
      } finally {
        setIsAddingCategory(false);
      }
    },
    [
      newCategoryColor,
      setCategories,
      setCategoryNameErrors,
      setIsAddingCategory,
      showCategoryFieldError,
    ],
  );

  const handleChooseNewCategoryColor = useCallback(
    (chosenColor: string) => setNewCategoryColor(chosenColor),
    [setNewCategoryColor],
  );

  const handleRequestDeleteCategory = useCallback(
    (categoryId: string) => setDeleteTargetCategoryId(categoryId),
    [setDeleteTargetCategoryId],
  );

  const handleConfirmDeleteCategory = useCallback(async () => {
    if (deleteTargetCategoryId === null) return;
    setSubmittingDialogId(DELETE_CATEGORY_DIALOG_ID);
    try {
      await deleteCategory(deleteTargetCategoryId);
      setCategories((currentCategories) =>
        currentCategories.filter((category) => category.id !== deleteTargetCategoryId),
      );
      setCategoryNameErrors((currentErrors) => withoutKey(currentErrors, deleteTargetCategoryId));
      setDeleteTargetCategoryId(null);
      hidePopover(DELETE_CATEGORY_DIALOG_ID);
    } catch (deleteError) {
      reportAppError(deleteError);
    } finally {
      setSubmittingDialogId(null);
    }
  }, [
    deleteTargetCategoryId,
    setCategories,
    setCategoryNameErrors,
    setDeleteTargetCategoryId,
    setSubmittingDialogId,
  ]);

  return {
    handleRenameCategory,
    handleRecolorCategory,
    handleAddCategory,
    handleChooseNewCategoryColor,
    handleRequestDeleteCategory,
    handleConfirmDeleteCategory,
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
    handleSubmitSessions,
    handleDeleteAccount,
  };
};

export default useSettingsEvents;
