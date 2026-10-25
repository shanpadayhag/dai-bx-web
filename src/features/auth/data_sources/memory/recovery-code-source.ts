let shownRecoveryCodes: readonly string[] = [];

const memoryRecoveryCodeSource = {
  save: (recoveryCodes: readonly string[]) => {
    shownRecoveryCodes = recoveryCodes;
  },
  findAll: () => shownRecoveryCodes,
  clear: () => {
    shownRecoveryCodes = [];
  },
};

export default memoryRecoveryCodeSource;
