import { useState } from 'react';
import type AppError from '@/core/app-error';
import type { Category } from '@/core/category';
import type { AuthenticatorSetup } from '@/features/auth/entities/authenticator-setup';
import type { Account } from '@/features/settings/entities/account';
import type { AccountSession } from '@/features/settings/entities/account-session';
import { SUGGESTED_CATEGORY_COLORS } from '@/features/settings/components/category-list';

const useSettingsStates = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [accountSessions, setAccountSessions] = useState<readonly AccountSession[]>([]);
  const [accountLoadError, setAccountLoadError] = useState<AppError | null>(null);
  const [submittingDialogId, setSubmittingDialogId] = useState<string | null>(null);
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<readonly string[] | null>(null);
  const [replacementSetup, setReplacementSetup] = useState<AuthenticatorSetup | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [categories, setCategories] = useState<readonly Category[]>([]);
  const [categoryNameErrors, setCategoryNameErrors] = useState<Readonly<Record<string, string>>>(
    {},
  );
  const [newCategoryColor, setNewCategoryColor] = useState<string>(SUGGESTED_CATEGORY_COLORS[0]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [deleteTargetCategoryId, setDeleteTargetCategoryId] = useState<Category['id'] | null>(null);

  return {
    account,
    setAccount,
    accountSessions,
    setAccountSessions,
    accountLoadError,
    setAccountLoadError,
    submittingDialogId,
    setSubmittingDialogId,
    newRecoveryCodes,
    setNewRecoveryCodes,
    replacementSetup,
    setReplacementSetup,
    isSigningOut,
    setIsSigningOut,
    categories,
    setCategories,
    categoryNameErrors,
    setCategoryNameErrors,
    newCategoryColor,
    setNewCategoryColor,
    isAddingCategory,
    setIsAddingCategory,
    deleteTargetCategoryId,
    setDeleteTargetCategoryId,
  };
};

export default useSettingsStates;
