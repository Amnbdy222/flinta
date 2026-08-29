import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/authService';
import {
  Package,
  User,
  MapPin,
  RotateCcw,
  Check,
  AlertCircle,
  Heart,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { AccountLayout, AccountTabKey } from '../components/AccountLayout';

export const AccountPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<AccountTabKey>('overview');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (tabParam === 'profile') {
      setActiveTab('profile');
    } else {
      setActiveTab('overview');
    }
  }, [tabParam]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const clientName = profile?.full_name || user?.email?.split('@')[0] || 'Client';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      await updateProfile(user.id, { full_name: fullName, phone });
      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile information updated successfully.' });
    } catch (err: unknown) {
      console.error('Update profile error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountLayout activeKey={activeTab} title="My Account Overview">
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* WELCOME BANNER — Minimal (Name & Email Only) */}
            <div className="bg-[#0A0A0A] text-[#FAF9F6] p-6 sm:p-8 shadow-md border border-[#0A0A0A]">
              <div className="space-y-1">
                <h2 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-light tracking-wide text-white">
                  Welcome <span className="font-semibold">{clientName}</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#A39E93] tracking-wider uppercase font-light">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* QUICK ACTION CARDS — 2 cols on mobile, 3 on lg */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 sm:gap-5">
              {[
                { to: '/account/orders', icon: <Package size={20} strokeWidth={1.5} />, label: 'Orders', desc: 'Track, view and manage your garment purchases.' },
                { to: '/wishlist', icon: <Heart size={20} strokeWidth={1.5} />, label: 'Wishlist', desc: 'Save favorite garments for quick access.' },
                { to: '/account/returns', icon: <RotateCcw size={20} strokeWidth={1.5} />, label: 'Returns', desc: 'Check refund status and request exchanges.' },
                { to: '/account/addresses', icon: <MapPin size={20} strokeWidth={1.5} />, label: 'Addresses', desc: 'Manage shipping addresses for checkout.' },
                { to: '/account?tab=profile', icon: <User size={20} strokeWidth={1.5} />, label: 'Profile', desc: 'Update your name, phone and settings.' },
                { to: '/contact', icon: <HelpCircle size={20} strokeWidth={1.5} />, label: 'Client Care', desc: 'Get support or custom order assistance.' },
              ].map(({ to, icon, label, desc }) => (
                <Link
                  key={to}
                  to={to}
                  className="bg-white p-4 sm:p-5 md:p-6 hairline-all hover:border-[#0A0A0A] hover:shadow-md transition-all group flex flex-col items-center text-center space-y-2 sm:space-y-3"
                >
                  <div className="p-2.5 sm:p-3 bg-[#FAF9F6] rounded-full group-hover:bg-[#0A0A0A] group-hover:text-[#FAF9F6] transition-colors">
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-editorial text-base sm:text-lg font-medium text-[#0A0A0A] uppercase tracking-wide leading-tight">
                      {label}
                    </h3>
                    <p className="text-[0.65rem] sm:text-xs text-[#736E65] font-light pt-1 leading-relaxed hidden sm:block">
                      {desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* PROFILE EDIT FORM TAB */}
        {activeTab === 'profile' && (
          <div className="bg-white hairline-all p-5 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
            <div className="flex items-start justify-between pb-4 hairline-b gap-3">
              <div>
                <h2 className="font-editorial text-xl sm:text-2xl font-light uppercase text-[#0A0A0A]">
                  PROFILE INFORMATION
                </h2>
                <p className="text-xs text-[#736E65] font-light pt-0.5">
                  Update your account details and contact preferences.
                </p>
              </div>
              <ShieldCheck size={22} className="text-[#736E65] flex-shrink-0 mt-1" />
            </div>

            {message && (
              <div
                className={`p-3 sm:p-4 text-xs flex items-start sm:items-center space-x-2 sm:space-x-3 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-900/20'
                    : 'bg-red-50 text-red-900 border border-red-900/20'
                }`}
              >
                {message.type === 'success' ? <Check size={15} className="flex-shrink-0 mt-0.5 sm:mt-0" /> : <AlertCircle size={15} className="flex-shrink-0 mt-0.5 sm:mt-0" />}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-5 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                  EMAIL ADDRESS (READ-ONLY)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-[#E6E4DD]/50 border border-[#0A0A0A]/10 px-4 py-3 text-xs tracking-wider text-[#736E65] cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                  PHONE NUMBER
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-editorial-primary py-3 px-8 text-xs tracking-[0.25em] disabled:opacity-50 w-full sm:w-auto justify-center"
                >
                  {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
                <Link
                  to="/account"
                  className="btn-editorial-outline py-3 px-6 text-xs tracking-[0.2em] w-full sm:w-auto text-center"
                >
                  CANCEL
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </AccountLayout>
  );
};
