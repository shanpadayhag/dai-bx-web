import type SignedInUser from '@/features/auth/entities/signed-in-user';

type Session = {
  user: SignedInUser;
};

export default Session;
