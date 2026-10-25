import backendAccountSource from '@/features/settings/data_sources/backend/account-source';
import type { AccountProfile, ProfileChanges } from '@/features/settings/entities/account';

type UpdateProfileParams = {
  profileChanges: ProfileChanges;
};

const updateProfile = (params: UpdateProfileParams): Promise<AccountProfile> =>
  backendAccountSource.updateProfile(params.profileChanges);

export default updateProfile;
