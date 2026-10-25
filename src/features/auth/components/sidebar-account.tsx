'use client';

import { LogOut } from 'lucide-react';
import Avatar from '@/core/components/atoms/avatar';
import IconButton from '@/core/components/atoms/icon-button';
import { initialsOf } from '@/features/auth/entities/signed-in-user';
import useSidebarAccountEvents from '@/features/auth/events/use-sidebar-account-events';
import { useSignedInUser } from '@/features/auth/states/signed-in-user-context';
import useSidebarAccountStates from '@/features/auth/states/use-sidebar-account-states';

const SidebarAccount = () => {
  const signedInUser = useSignedInUser();
  const states = useSidebarAccountStates();
  const events = useSidebarAccountEvents(states);

  if (signedInUser === null) return null;

  return (
    <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-border bg-background p-2">
      <Avatar initials={initialsOf(signedInUser.name)} />
      <div className="grid min-w-0 flex-1">
        <span className="truncate text-[13px] font-medium text-foreground">
          {signedInUser.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">{signedInUser.email}</span>
      </div>
      <IconButton
        label="Sign out"
        disabled={states.isSigningOut}
        onClick={() => void events.handleSignOut()}
      >
        <LogOut />
      </IconButton>
    </div>
  );
};

export default SidebarAccount;
