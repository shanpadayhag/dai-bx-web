import { LoaderCircle, WifiOff } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import EmptyState from '@/core/components/molecules/empty-state';
import type AppError from '@/core/app-error';

type SessionCheckScreenProps = {
  sessionCheckError: AppError | null;
  onRetry: () => void;
};

const SessionCheckScreen = ({ sessionCheckError, onRetry }: SessionCheckScreenProps) => (
  <div className="grid min-h-dvh place-items-center bg-surface px-4">
    {sessionCheckError === null ? (
      <div
        role="status"
        aria-label="Checking your session"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground"
      >
        <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
        Opening DaiBX…
      </div>
    ) : (
      <EmptyState
        icon={<WifiOff />}
        title={sessionCheckError.title}
        description={`DaiBX couldn't check your session: ${sessionCheckError.description}.`}
        action={
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    )}
  </div>
);

export default SessionCheckScreen;
