import { Eye } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';
import joinClassNames from '@/core/class-names';
import IconButton from '@/core/components/atoms/icon-button';
import Input from '@/core/components/atoms/input';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  autoComplete: 'current-password' | 'new-password';
};

const PasswordInput = ({ className, ...inputProps }: PasswordInputProps) => (
  <div className="relative">
    <Input
      type="password"
      spellCheck={false}
      className={joinClassNames('pr-11', className)}
      {...inputProps}
    />
    <IconButton label="Show password" className="absolute top-1 right-1">
      <Eye />
    </IconButton>
  </div>
);

export default PasswordInput;
