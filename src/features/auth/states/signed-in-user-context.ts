import { createContext, useContext } from 'react';
import type SignedInUser from '@/features/auth/entities/signed-in-user';

export const SignedInUserContext = createContext<SignedInUser | null>(null);

export const useSignedInUser = () => useContext(SignedInUserContext);
