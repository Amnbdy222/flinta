import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * SignupPage now redirects to the Login page since OTP-based auth
 * auto-creates accounts. No separate signup flow needed.
 */
export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  useEffect(() => {
    const loginUrl = redirectParam
      ? `/login?redirect=${encodeURIComponent(redirectParam)}`
      : '/login';
    navigate(loginUrl, { replace: true });
  }, [navigate, redirectParam]);

  return null;
};
