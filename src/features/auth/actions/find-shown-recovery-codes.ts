import memoryRecoveryCodeSource from '@/features/auth/data_sources/memory/recovery-code-source';

const findShownRecoveryCodes = (): readonly string[] => memoryRecoveryCodeSource.findAll();

export default findShownRecoveryCodes;
