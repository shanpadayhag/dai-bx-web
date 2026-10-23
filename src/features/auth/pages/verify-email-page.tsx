import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import Button from '@/core/components/atoms/button';
import AuthFrame from '@/features/auth/components/auth-frame';
import AuthIcon from '@/features/auth/components/auth-icon';
import samplePendingAccountSource from '@/features/auth/data_sources/sample/pending-account-source';

const VerifyEmailPage = () => {
  const pendingAccount = samplePendingAccountSource.find();

  return (
    <AuthFrame
      icon={
        <AuthIcon>
          <MailCheck />
        </AuthIcon>
      }
      title="Check your email"
      description={
        <>
          We sent a link to{' '}
          <span className="font-medium text-foreground">{pendingAccount.email}</span>. Open it on
          any device to confirm the address. It works once and expires in 24 hours.
        </>
      }
      footer={
        <>
          Wrong address?{' '}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Sign up again
          </Link>
        </>
      }
    >
      <div className="grid gap-3">
        <Button variant="secondary" size="lg" className="w-full">
          Send the link again
        </Button>
        <p className="text-xs text-muted-foreground">
          Nothing after a few minutes? Check spam, or send it again. You can ask for a new link a
          few times an hour.
        </p>
      </div>
    </AuthFrame>
  );
};

export default VerifyEmailPage;
