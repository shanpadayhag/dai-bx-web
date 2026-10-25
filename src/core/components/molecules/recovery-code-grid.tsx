type RecoveryCodeGridProps = {
  recoveryCodes: readonly string[];
};

const RecoveryCodeGrid = ({ recoveryCodes }: RecoveryCodeGridProps) => (
  <ol className="grid grid-cols-2 gap-x-6 gap-y-2.5 rounded-2xl border border-border bg-surface px-5 py-4">
    {recoveryCodes.map((recoveryCode, codeIndex) => (
      <li key={recoveryCode} className="flex items-baseline gap-2.5">
        <span className="w-4 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
          {codeIndex + 1}
        </span>
        <code className="font-mono text-[13px] tracking-wide text-foreground">{recoveryCode}</code>
      </li>
    ))}
  </ol>
);

export default RecoveryCodeGrid;
