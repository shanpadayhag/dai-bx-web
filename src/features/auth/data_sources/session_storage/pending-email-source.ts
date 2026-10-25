const PENDING_EMAIL_KEY = 'daibx:pending-email';

const sessionStoragePendingEmailSource = {
  save: (pendingEmail: string) => {
    try {
      window.sessionStorage.setItem(PENDING_EMAIL_KEY, pendingEmail);
    } catch {
      return;
    }
  },
  find: () => {
    try {
      return window.sessionStorage.getItem(PENDING_EMAIL_KEY);
    } catch {
      return null;
    }
  },
};

export default sessionStoragePendingEmailSource;
