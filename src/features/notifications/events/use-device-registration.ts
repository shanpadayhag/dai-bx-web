'use client';

import { useEffect } from 'react';
import reRegisterThisDevice from '@/features/notifications/actions/re-register-this-device';

const useDeviceRegistration = () => {
  useEffect(() => {
    void reRegisterThisDevice().catch(() => null);
  }, []);
};

export default useDeviceRegistration;
