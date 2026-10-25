'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';
import joinClassNames from '@/core/class-names';
import IconButton from '@/core/components/atoms/icon-button';
import Input from '@/core/components/atoms/input';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  autoComplete: 'current-password' | 'new-password';
};

const PasswordInput = ({ className, ...inputProps }: PasswordInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={isPasswordVisible ? 'text' : 'password'}
        spellCheck={false}
        className={joinClassNames('pr-11', className)}
        {...inputProps}
      />
      <IconButton
        label={isPasswordVisible ? 'Hide password' : 'Show password'}
        aria-pressed={isPasswordVisible}
        className="absolute top-1 right-1"
        onClick={() => setIsPasswordVisible((wasPasswordVisible) => !wasPasswordVisible)}
      >
        {isPasswordVisible ? <EyeOff /> : <Eye />}
      </IconButton>
    </div>
  );
};

export default PasswordInput;
