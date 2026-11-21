export type PushSupport = 'supported' | 'needs-home-screen' | 'unsupported';

export type PushEnvironment = {
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
  isAppleMobile: boolean;
  isStandalone: boolean;
};

const pushSupport = (pushEnvironment: PushEnvironment): PushSupport => {
  if (pushEnvironment.isAppleMobile && !pushEnvironment.isStandalone) return 'needs-home-screen';
  const canPush =
    pushEnvironment.hasServiceWorker &&
    pushEnvironment.hasPushManager &&
    pushEnvironment.hasNotification;
  return canPush ? 'supported' : 'unsupported';
};

export default pushSupport;
