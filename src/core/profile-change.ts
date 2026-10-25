export const PROFILE_CHANGED_EVENT_NAME = 'daibx:profile-changed';

export type ProfileChange = {
  name: string;
};

export const announceProfileChange = (profileChange: ProfileChange) => {
  window.dispatchEvent(
    new CustomEvent<ProfileChange>(PROFILE_CHANGED_EVENT_NAME, { detail: profileChange }),
  );
};

export const readProfileChange = (profileChangeEvent: Event): ProfileChange | null =>
  profileChangeEvent instanceof CustomEvent &&
  typeof profileChangeEvent.detail === 'object' &&
  profileChangeEvent.detail !== null &&
  typeof (profileChangeEvent.detail as { name?: unknown }).name === 'string'
    ? { name: (profileChangeEvent.detail as { name: string }).name }
    : null;
