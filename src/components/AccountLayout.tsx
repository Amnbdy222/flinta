import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, LogOut, AlertTriangle, X } from 'lucide-react';
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
    { key: 'overview', label: 'OVERVIEW', path: '/account' },
    { key: 'profile', label: 'PROFILE', path: '/account?tab=profile' },
    { key: 'orders', label: 'ORDERS', path: '/account/orders' },
    { key: 'wishlist', label: 'WISHLIST', path: '/wishlist' },
    { key: 'addresses', label: 'ADDRESSES', path: '/account/addresses' },
    { key: 'returns', label: 'REFUNDS & RETURNS', path: '/account/returns' },
    { key: 'contact', label: 'CLIENT HELP', path: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-2 sm:pt-6 md:pt-8 pb-12 sm:pb-16 md:pb-24 text-[#0A0A0A]">
      <SEO title={title} description={description} />

      <div className="container-editorial max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
        {/* TOP HEADER — account title (compact on mobile, editorial on desktop) */}
        <div className="py-2.5 sm:py-4 hairline-b mb-0">
          <span className="text-[0.6rem] sm:text-[0.65rem] font-medium tracking-[0.25em] uppercase text-[#736E65]">
            CLIENT PORTAL
          </span>
          <h1 className="font-editorial text-lg sm:text-2xl md:text-3xl font-light uppercase tracking-tight text-[#0A0A0A] leading-tight">
            MY ACCOUNT
          </h1>
        </div>

        {/* MOBILE HORIZONTAL SCROLLABLE NAV */}
        <nav
          className="lg:hidden flex overflow-x-auto no-scrollbar hairline-b bg-white -mx-3 px-3 sm:mx-0 sm:px-0"
          aria-label="Account navigation"
        >
          {navMenuItems.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 text-[0.6rem] sm:text-[0.65rem] tracking-[0.18em] font-medium uppercase whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#0A0A0A] text-[#0A0A0A]'
                    : 'border-transparent text-[#736E65] hover:text-[#0A0A0A]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* DESKTOP 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-8 items-start pt-3 sm:pt-6 lg:pt-8">
          {/* DESKTOP STICKY LEFT SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-1 lg:sticky lg:top-24 bg-white hairline-all shadow-xs">
            <nav className="flex flex-col p-2" aria-label="Account sidebar navigation">
              {navMenuItems.map((item) => {
                const isActive = activeKey === item.key;
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    className={`flex items-center justify-between px-4 py-3 text-xs tracking-[0.2em] font-medium uppercase transition-colors ${
                      isActive
                        ? 'bg-[#0A0A0A] text-[#FAF9F6]'
                        : 'text-[#383531] hover:bg-[#FAF9F6] hover:text-[#0A0A0A]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight size={14} className={isActive ? 'text-[#FAF9F6]' : 'text-[#A39E93]'} />
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center justify-between px-4 py-3 text-xs tracking-[0.2em] font-medium uppercase text-red-700 hover:bg-red-50 transition-colors text-left hairline-t mt-1 cursor-pointer w-full"
              >
                <span>LOG OUT</span>
                <LogOut size={14} />
              </button>
            </nav>
          </aside>

          {/* MAIN CONTENT */}
          <main className="lg:col-span-3 min-w-0">{children}</main>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0A0A0A]/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setShowLogoutModal(false)}
            aria-hidden="true"
          />

          {/* Modal Dialog Card */}
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
