'use client';

import { useEffect } from 'react';

export default function RecoveryRedirect() {
  useEffect(() => {
    if (window.location.pathname === '/admin/reset-password') return;

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(window.location.search);
    const hasRecoveryToken = hashParams.get('type') === 'recovery' && hashParams.has('access_token');
    const hasRecoveryError =
      hashParams.get('error_code') === 'otp_expired' ||
      queryParams.get('error_code') === 'otp_expired' ||
      hashParams.get('error') === 'access_denied' ||
      queryParams.get('error') === 'access_denied';

    if (hasRecoveryToken || hasRecoveryError) {
      window.location.replace(`/admin/reset-password${window.location.hash}`);
    }
  }, []);

  return null;
}
