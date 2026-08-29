import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      const isCheckout = location.pathname.includes('checkout');
      openAuthModal({
        mode: 'login',
        title: isCheckout ? 'SIGN IN TO CHECKOUT' : 'CLIENT PORTAL ACCESS',
        showGuestOption: isCheckout,
        onSuccess: () => {
          navigate(location.pathname + location.search, { replace: true });
        },
        onClose: () => {
          if (isCheckout) {
            navigate('/cart', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        },
      });
    }
  }, [user, loading, location, openAuthModal, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 text-center text-xs tracking-widest uppercase text-[#736E65]">
        VERIFYING CLIENT AUTHENTICATION...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 text-center text-xs tracking-widest uppercase text-[#736E65]">
        AUTHENTICATION REQUIRED. OPENING CLIENT ACCESS...
      </div>
    );
  }

  return <>{children}</>;
};
