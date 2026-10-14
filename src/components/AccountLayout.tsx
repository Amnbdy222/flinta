import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, LogOut, AlertTriangle, X } from 'lucide-react';
import { SEO } from './SEO';

export type AccountTabKey =
  | 'overview'
  | 'profile'
  | 'orders'
  | 'wishlist'
  | 'addresses'
  | 'returns'
  | 'contact';

interface AccountLayoutProps {
  activeKey: AccountTabKey;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const AccountLayout: React.FC<AccountLayoutProps> = ({
  activeKey,
  title = 'My Account',
  description = 'Manage your FLINT A account profile, orders, returns and saved addresses.',
  children,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/', { replace: true });
  };

  const navMenuItems = [
    { key: 'orders', label: 'ORDERS', path: '/account/orders' },
    { key: 'returns', label: 'REFUNDS', path: '/account/returns' },
    { key: 'wishlist', label: 'WISHLIST', path: '/wishlist' },
    { key: 'addresses', label: 'SAVED ADDRESSES', path: '/account/addresses' },
    { key: 'contact', label: 'HELP & SUPPORT', path: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] pt-4 sm:pt-6 pb-16 sm:pb-24">
      <SEO title={title} description={description} noindex />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* TOP BAR: BACK TO ACCOUNT & LOG OUT */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#EAE8E2] mb-5 sm:mb-6">
          <Link
            to="/account"
            className="inline-flex items-center text-xs tracking-wider uppercase text-[#736E65] hover:text-[#0A0A0A] transition-colors group"
          >
            <ChevronLeft
              size={16}
              className="mr-1 group-hover:-translate-x-0.5 transition-transform"
            />
            <span>BACK TO ACCOUNT</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="inline-flex items-center text-xs tracking-wider uppercase text-red-700 hover:text-red-900 transition-colors cursor-pointer"
          >
            <LogOut size={13} className="mr-1.5" />
            <span>LOG OUT</span>
          </button>
        </div>

        {/* HORIZONTAL PILL SWITCHER TABS (CLEAN HIGH-FASHION NAVIGATION) */}
        <nav
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mb-6 sm:mb-8"
          aria-label="Account Sub-navigation"
        >
          {navMenuItems.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`shrink-0 px-3.5 sm:px-4 py-2 text-[11px] sm:text-xs font-semibold tracking-wider uppercase transition-all shadow-xs ${
                  isActive
                    ? 'bg-[#0A0A0A] text-white'
                    : 'bg-white text-[#736E65] hover:text-[#0A0A0A] border border-[#EAE8E2] hover:border-gray-400'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* MAIN FOCUSED CONTENT CONTAINER */}
        <main className="w-full">{children}</main>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0A0A0A]/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setShowLogoutModal(false)}
            aria-hidden="true"
          />

          <div className="relative bg-[#FAF9F6] border border-[#0A0A0A]/20 p-6 sm:p-8 max-w-md w-full shadow-2xl z-10 space-y-6 animate-fade-in">
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 p-1 text-[#736E65] hover:text-[#0A0A0A] focus:outline-none"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-[#0A0A0A] text-[#FAF9F6] shrink-0">
                <AlertTriangle size={22} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-editorial text-xl sm:text-2xl font-light uppercase tracking-tight text-[#0A0A0A]">
                  LOG OUT CONFIRMATION
                </h3>
                <p className="text-[0.65rem] text-[#736E65] tracking-widest uppercase pt-0.5">
                  FLINT A CLIENT PORTAL
                </p>
              </div>
            </div>

            <p className="text-xs text-[#383531] font-light leading-relaxed">
              Are you sure you want to log out of your FLINT A account? You will need to sign in again to view purchase history, saved addresses, and active orders.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full sm:w-auto btn-editorial-outline text-xs py-3 px-6 tracking-[0.2em] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="w-full sm:w-auto btn-editorial-primary text-xs py-3 px-6 tracking-[0.2em] bg-red-800 text-white hover:bg-red-950 border-red-800 cursor-pointer"
              >
                CONFIRM LOG OUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
