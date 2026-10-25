import memoryRecoveryCodeSource from '@/features/auth/data_sources/memory/recovery-code-source';

const forgetShownRecoveryCodes = (): void => memoryRecoveryCodeSource.clear();

export default forgetShownRecoveryCodes;
