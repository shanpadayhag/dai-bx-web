import joinClassNames from '@/core/class-names';

type AvatarProps = {
  initials: string;
  className?: string;
};

const Avatar = ({ initials, className }: AvatarProps) => (
  <span
    aria-hidden="true"
    className={joinClassNames(
      'inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-glow text-xs font-semibold text-primary-foreground ring-2 ring-background',
      className,
    )}
  >
    {initials}
  </span>
);

export default Avatar;
