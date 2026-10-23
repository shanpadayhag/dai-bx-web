const sampleRecoveryCodes = [
  'K7QM-2XRD-9FTB',
  'P4VN-8HWC-3JZE',
  'T9AR-6KXQ-1MDW',
  'B2HS-5NPY-7CGV',
  'W8ZE-4QTJ-2RKA',
  'M3XD-9BVF-6HNP',
  'R6CK-1WZM-8TQY',
  'G5JP-7AEH-4SXB',
  'Y1TW-3MRC-9VDK',
  'D4NF-8GKZ-5PQJ',
] as const;

const sampleRecoveryCodeSource = {
  findAll: (): readonly string[] => sampleRecoveryCodes,
};

export default sampleRecoveryCodeSource;
