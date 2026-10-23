import type { InputHTMLAttributes } from 'react';
import Input from '@/core/components/atoms/input';

type CodeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode'>;

const CodeInput = (codeInputProps: CodeInputProps) => (
  <Input
    type="text"
    inputMode="numeric"
    autoComplete="one-time-code"
    pattern="[0-9]{6}"
    maxLength={6}
    placeholder="000000"
    spellCheck={false}
    className="h-12 text-center font-mono text-xl tracking-[0.4em] tabular-nums placeholder:text-muted-foreground/50"
    {...codeInputProps}
  />
);

export default CodeInput;
