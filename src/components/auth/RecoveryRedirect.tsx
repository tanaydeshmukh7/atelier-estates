'use client';

import { useEffect } from 'react';

export default function RecoveryRedirect() {
  useEffect(() => {
    if (window.location.pathname === '/admin/reset-password') return;

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(window.location.search);
    const hasRecoveryToken =
      hashParams.has('access_token') &&
      (hashParams.get('type') === 'recovery' || hashParams.has('refresh_token'));
    const hasRecoveryCode = queryParams.has('code');
    const hasRecoveryError =
      hashParams.get('error_code') === 'otp_expired' ||
      queryParams.get('error_code') === 'otp_expired' ||
      hashParams.get('error') === 'access_denied' ||
      queryParams.get('error') === 'access_denied';

    if (hasRecoveryToken || hasRecoveryCode || hasRecoveryError) {
      window.location.replace(`/admin/reset-password${window.location.search}${window.location.hash}`);
    }
  }, []);

  return null;
}
