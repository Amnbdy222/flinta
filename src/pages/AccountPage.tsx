import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/authService';
import { fetchCustomerOrders } from '../services/orderService';
import { fetchCustomerAddresses } from '../services/addressService';
import { Order, Address } from '../types/database.types';
import { SEO } from '../components/SEO';
import {
  User,
  MapPin,
  Package,
  RotateCcw,
  Heart,
  HelpCircle,
  LogOut,
  ChevronRight,
  Gift,
  X,
  Check,
  AlertCircle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { user, profile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Real customer data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [, setLoadingData] = useState(true);

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Profile form state (strictly initialized from user's real profile)
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync profile form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  // Open profile modal if ?tab=profile in URL
  useEffect(() => {
    if (searchParams.get('tab') === 'profile') {
      setShowProfileModal(true);
    }
  }, [searchParams]);

  // Load real customer orders and addresses
  useEffect(() => {
    let isMounted = true;
    const loadRealData = async () => {
      try {
        setLoadingData(true);
        const [customerOrders, customerAddresses] = await Promise.all([
          fetchCustomerOrders(),
          fetchCustomerAddresses(),
        ]);
        if (isMounted) {
          setOrders(customerOrders || []);
          setAddresses(customerAddresses || []);
        }
      } catch (err) {
        console.error('Error loading account customer data:', err);
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    };

    if (user) {
      loadRealData();
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Real data calculations
  const rawName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Member';
  const firstName = rawName.trim().split(' ')[0].toUpperCase();

  // Sum lifetime spend from valid orders
  const totalSpent = orders.reduce((sum, order) => {
    return sum + (Number(order.total_amount) || 0);
  }, 0);

  const MEMBERSHIP_THRESHOLD = 5000;
  const remainingToUnlock = Math.max(0, MEMBERSHIP_THRESHOLD - totalSpent);
  const progressPercent = Math.min(
    100,
    Math.round((totalSpent / MEMBERSHIP_THRESHOLD) * 100)
  );

  const memberSinceFormatted = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : '';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      await updateProfile(user.id, { full_name: fullName, phone });
      await refreshProfile();
      setMessage({ type: 'success', text: 'Personal information updated successfully.' });
    } catch (err: unknown) {
      console.error('Update profile error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update personal information.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/', { replace: true });
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setMessage(null);
    if (searchParams.get('tab') === 'profile') {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] pt-4 sm:pt-6 pb-16 sm:pb-24">
      <SEO
        title="My Account"
        description="Manage your FLINT A personal account, orders, refunds and saved addresses."
        noindex
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* ========================================================= */}
        {/* TOP EDITORIAL BANNER (MATCHES SNITCH ACCOUNT BANNER EXACTLY) */}
        {/* ========================================================= */}
        <section
          aria-label="Account Overview Banner"
          className="bg-white border border-[#EAE8E2] overflow-hidden shadow-xs mb-8 sm:mb-10 flex flex-col md:flex-row"
        >
          {/* LEFT BOX: Welcome + Real Name + Model Photo + Status Pill */}
          <div className="md:w-1/2 p-5 sm:p-6 md:p-8 flex items-center justify-between relative bg-white overflow-hidden">
            <div className="space-y-1 z-10 pr-2">
              <span className="text-xs sm:text-sm font-light text-[#736E65] tracking-wide block">
                Welcome
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-[#0A0A0A] leading-tight">
                {firstName}
              </h1>

              {/* Status Pill Badge */}
              <div className="pt-4 sm:pt-6">
                <span className="inline-flex items-center px-3 py-1 bg-white border border-[#EAE8E2] text-[11px] font-medium tracking-wide text-[#736E65] shadow-xs">
                  {progressPercent >= 100
                    ? 'Active VIP Member'
                    : memberSinceFormatted
                    ? `Member since ${memberSinceFormatted}`
                    : 'Active Client'}
                </span>
              </div>
            </div>

            {/* Editorial Model Image */}
            <div className="relative shrink-0 w-32 sm:w-40 md:w-44 h-36 sm:h-44 md:h-48 overflow-hidden">
              <img
                src="/images/account_banner_model.jpg"
                alt="FLINT Member Lifestyle"
                className="w-full h-full object-cover object-top select-none pointer-events-none"
                loading="eager"
              />
            </div>
          </div>

          {/* RIGHT BOX: Charcoal Banner + FLINTX Brand + View Benefits + Progress Line */}
          <div className="md:w-1/2 bg-[#383838] p-5 sm:p-6 md:p-8 flex flex-col justify-between text-white border-t md:border-t-0 md:border-l border-[#454545]">
            {/* Top row: Spend to unlock headline & FLINTX logo badge */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs sm:text-[13px] font-semibold tracking-wider uppercase text-gray-200 leading-snug">
                  SPEND MORE TO UNLOCK MEMBERSHIP
                </p>
                <div className="shrink-0 tracking-widest text-right">
                  <span className="text-sm sm:text-base font-black text-white">FLINT</span>
                  <span className="text-sm sm:text-base font-black text-[#D4AF37]">X</span>
                </div>
              </div>

              {/* View Benefits Button */}
              <div className="mt-3 sm:mt-3.5">
                <button
                  type="button"
                  onClick={() => setShowBenefitsModal(true)}
                  className="inline-flex items-center px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white text-[#0A0A0A] text-[10px] sm:text-xs font-bold tracking-wider uppercase hover:bg-gray-100 transition-colors cursor-pointer shadow-xs"
                >
                  VIEW BENEFITS
                </button>
              </div>
            </div>

            {/* Bottom: Progress Bar with Gift Icon & Real Spent Subtext */}
            <div className="mt-6 pt-2">
              <div className="relative flex items-center">
                <div className="w-full bg-[#525252] h-[2px] relative overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowBenefitsModal(true)}
                  className="ml-2.5 shrink-0 w-7 h-7 rounded-full bg-[#2A2A2A] border border-gray-500/80 flex items-center justify-center text-amber-300 hover:text-white hover:border-white transition-all cursor-pointer shadow-xs"
                  title="View FLINTX Rewards"
                >
                  <Gift size={13} strokeWidth={2} />
                </button>
              </div>

              {/* Subtext based strictly on user's real spent data */}
              <p className="text-[11px] sm:text-xs text-gray-300 font-light mt-2 tracking-wide">
                {progressPercent >= 100
                  ? `Membership Unlocked • ₹${totalSpent.toLocaleString('en-IN')} Spent`
                  : `Spend ₹${remainingToUnlock.toLocaleString('en-IN')} to unlock.`}
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* ACCOUNT SECTION (PERSONAL INFORMATION & SAVED ADDRESSES) */}
        {/* ========================================================= */}
        <section aria-labelledby="section-account" className="mb-6 sm:mb-8">
          <h2
            id="section-account"
            className="text-xs font-semibold tracking-wider uppercase text-[#736E65] mb-2 sm:mb-3 px-1"
          >
            ACCOUNT
          </h2>

          <div className="bg-white border border-[#EAE8E2] divide-y divide-[#EAE8E2] shadow-xs">
            {/* PERSONAL INFORMATION ROW */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50/70 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3.5 sm:space-x-4">
                <User size={19} strokeWidth={1.5} className="text-[#0A0A0A] shrink-0" />
                <span className="text-xs sm:text-sm font-medium tracking-wider uppercase text-[#0A0A0A]">
                  PERSONAL INFORMATION
                </span>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-400 group-hover:text-[#0A0A0A] group-hover:translate-x-0.5 transition-all"
              />
            </button>

            {/* SAVED ADDRESSES ROW */}
            <Link
              to="/account/addresses"
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50/70 transition-colors text-left group"
            >
              <div className="flex items-center space-x-3.5 sm:space-x-4">
                <MapPin size={19} strokeWidth={1.5} className="text-[#0A0A0A] shrink-0" />
                <span className="text-xs sm:text-sm font-medium tracking-wider uppercase text-[#0A0A0A]">
                  SAVED ADDRESSES
                </span>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-400 group-hover:text-[#0A0A0A] group-hover:translate-x-0.5 transition-all"
              />
            </Link>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SHOPPING SECTION (ORDERS, REFUNDS, WISHLIST, CLIENT CARE) */}
        {/* ========================================================= */}
        <section aria-labelledby="section-shopping" className="mb-6 sm:mb-8">
          <h2
            id="section-shopping"
            className="text-xs font-semibold tracking-wider uppercase text-[#736E65] mb-2 sm:mb-3 px-1"
          >
            SHOPPING
          </h2>

          <div className="bg-white border border-[#EAE8E2] divide-y divide-[#EAE8E2] shadow-xs">
            {/* ORDERS ROW */}
            <Link
              to="/account/orders"
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50/70 transition-colors text-left group"
            >
              <div className="flex items-center space-x-3.5 sm:space-x-4">
                <Package size={19} strokeWidth={1.5} className="text-[#0A0A0A] shrink-0" />
                <span className="text-xs sm:text-sm font-medium tracking-wider uppercase text-[#0A0A0A]">
                  ORDERS
                </span>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-400 group-hover:text-[#0A0A0A] group-hover:translate-x-0.5 transition-all"
              />
            </Link>

            {/* REFUNDS ROW */}
            <Link
              to="/account/returns"
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50/70 transition-colors text-left group"
            >
              <div className="flex items-center space-x-3.5 sm:space-x-4">
                <RotateCcw size={19} strokeWidth={1.5} className="text-[#0A0A0A] shrink-0" />
                <span className="text-xs sm:text-sm font-medium tracking-wider uppercase text-[#0A0A0A]">
                  REFUNDS
                </span>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-400 group-hover:text-[#0A0A0A] group-hover:translate-x-0.5 transition-all"
              />
            </Link>

            {/* WISHLIST ROW */}
            <Link
              to="/wishlist"
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50/70 transition-colors text-left group"
            >
              <div className="flex items-center space-x-3.5 sm:space-x-4">
                <Heart size={19} strokeWidth={1.5} className="text-[#0A0A0A] shrink-0" />
                <span className="text-xs sm:text-sm font-medium tracking-wider uppercase text-[#0A0A0A]">
                  WISHLIST
                </span>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-400 group-hover:text-[#0A0A0A] group-hover:translate-x-0.5 transition-all"
              />
            </Link>

            {/* HELP & SUPPORT ROW */}
            <Link
              to="/contact"
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50/70 transition-colors text-left group"
            >
              <div className="flex items-center space-x-3.5 sm:space-x-4">
                <HelpCircle size={19} strokeWidth={1.5} className="text-[#0A0A0A] shrink-0" />
                <span className="text-xs sm:text-sm font-medium tracking-wider uppercase text-[#0A0A0A]">
                  HELP &amp; SUPPORT
                </span>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-400 group-hover:text-[#0A0A0A] group-hover:translate-x-0.5 transition-all"
              />
            </Link>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SESSION SECTION (LOG OUT) */}
        {/* ========================================================= */}
        <section aria-labelledby="section-session" className="mb-8">
          <div className="bg-white border border-[#EAE8E2] shadow-xs">
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-red-50/50 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3.5 sm:space-x-4 text-red-700">
                <LogOut size={19} strokeWidth={1.5} className="shrink-0" />
                <span className="text-xs sm:text-sm font-medium tracking-wider uppercase">
                  LOG OUT
                </span>
              </div>
              <ChevronRight
                size={18}
                className="text-red-300 group-hover:text-red-700 group-hover:translate-x-0.5 transition-all"
              />
            </button>
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* PERSONAL INFORMATION MODAL (SLIDE-OVER / EDIT MODAL)      */}
      {/* ========================================================= */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0A0A0A]/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={closeProfileModal}
            aria-hidden="true"
          />

          <div className="relative bg-[#FAF9F6] border border-[#0A0A0A]/20 p-6 sm:p-8 max-w-lg w-full shadow-2xl z-10 space-y-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeProfileModal}
              className="absolute top-4 right-4 p-1 text-[#736E65] hover:text-[#0A0A0A] focus:outline-none"
              aria-label="Close profile modal"
            >
              <X size={20} />
            </button>

            <div>
              <div className="flex items-center space-x-2 text-[#736E65] text-[10px] tracking-widest uppercase mb-1">
                <ShieldCheck size={14} />
                <span>FLINT A SECURE PROFILE</span>
              </div>
              <h3 className="font-editorial text-2xl font-light uppercase tracking-tight text-[#0A0A0A]">
                PERSONAL INFORMATION
              </h3>
              <p className="text-xs text-[#736E65] font-light pt-0.5">
                View your account metrics and update your personal details.
              </p>
            </div>

            {/* REAL ACCOUNT DATA STRIP */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-white border border-[#EAE8E2] text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#736E65]">Total Orders</p>
                <p className="text-sm font-bold text-[#0A0A0A] mt-0.5">{orders.length}</p>
              </div>
              <div className="border-x border-[#EAE8E2]">
                <p className="text-[10px] uppercase tracking-wider text-[#736E65]">Lifetime Spend</p>
                <p className="text-sm font-bold text-[#0A0A0A] mt-0.5">
                  ₹{totalSpent.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#736E65]">Saved Places</p>
                <p className="text-sm font-bold text-[#0A0A0A] mt-0.5">{addresses.length}</p>
              </div>
            </div>

            {message && (
              <div
                className={`p-3.5 text-xs flex items-start space-x-2.5 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-900/20'
                    : 'bg-red-50 text-red-900 border border-red-900/20'
                }`}
              >
                {message.type === 'success' ? (
                  <Check size={16} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-white border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block flex items-center justify-between">
                  <span>EMAIL ADDRESS</span>
                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-2 py-0.5 font-semibold">
                    VERIFIED
                  </span>
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-[#EAE8E2]/50 border border-[#0A0A0A]/10 px-4 py-3 text-xs tracking-wider text-[#736E65] cursor-not-allowed"
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
                  className="w-full bg-white border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              {memberSinceFormatted && (
                <div className="pt-1 text-[11px] text-[#736E65]">
                  Member since <span className="text-[#0A0A0A] font-medium">{memberSinceFormatted}</span>
                </div>
              )}

              <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-editorial-primary py-3 px-8 text-xs tracking-[0.25em] disabled:opacity-50 w-full sm:w-auto justify-center cursor-pointer"
                >
                  {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
                <button
                  type="button"
                  onClick={closeProfileModal}
                  className="btn-editorial-outline py-3 px-6 text-xs tracking-[0.2em] w-full sm:w-auto text-center cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FLINTX MEMBERSHIP BENEFITS MODAL                         */}
      {/* ========================================================= */}
      {showBenefitsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0A0A0A]/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setShowBenefitsModal(false)}
            aria-hidden="true"
          />

          <div className="relative bg-[#FAF9F6] border border-[#0A0A0A]/20 p-6 sm:p-8 max-w-lg w-full shadow-2xl z-10 space-y-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowBenefitsModal(false)}
              className="absolute top-4 right-4 p-1 text-[#736E65] hover:text-[#0A0A0A] focus:outline-none"
              aria-label="Close benefits modal"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-[#736E65] text-[10px] tracking-widest uppercase">
                <Sparkles size={14} className="text-[#D4AF37]" />
                <span>FLINTX PRIVILEGES</span>
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl font-light uppercase tracking-tight text-[#0A0A0A]">
                TIER BENEFITS
              </h3>
              <p className="text-xs text-[#736E65] font-light leading-relaxed">
                Spend ₹{MEMBERSHIP_THRESHOLD.toLocaleString('en-IN')} across any garment orders to unlock exclusive lifetime perks.
              </p>
            </div>

            {/* REAL USER SPENT STATUS */}
            <div className="bg-[#383838] text-white p-5 space-y-3">
              <div className="flex items-center justify-between text-xs tracking-wider uppercase font-semibold">
                <span>YOUR SPEND PROGRESS</span>
                <span className="text-[#D4AF37]">
                  ₹{totalSpent.toLocaleString('en-IN')} / ₹{MEMBERSHIP_THRESHOLD.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-[#525252] h-[3px] overflow-hidden">
                <div
                  className="bg-[#D4AF37] h-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-300 font-light">
                {progressPercent >= 100
                  ? 'Congratulations! You have unlocked all FLINTX Gold privileges.'
                  : `Spend ₹${remainingToUnlock.toLocaleString('en-IN')} more to unlock FLINTX Gold status.`}
              </p>
            </div>

            {/* PRIVILEGES LIST */}
            <div className="space-y-3.5 pt-1">
              {[
                {
                  title: 'Free Priority Express Delivery',
                  desc: 'Complimentary expedited insured shipping on every order across India with zero minimum cart value.',
                },
                {
                  title: 'Early Drop & Archival Access',
                  desc: 'Get exclusive 24-hour advance access to limited garment drops, runway editions, and archival sales.',
                },
                {
                  title: 'Instant 7-Day Reverse Pickup',
                  desc: 'Hassle-free doorstep exchanges and returns with instant refunds initiated upon handover.',
                },
                {
                  title: 'Personal Styling Concierge',
                  desc: 'Direct WhatsApp and email consultation with FLINT creative stylists for custom fits and tailoring advice.',
                },
                {
                  title: 'Birthday Gift & Secret Drops',
                  desc: 'An annual complimentary store token and invitation to private members-only trunk presentations.',
                },
              ].map((perk, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-left">
                  <div className="p-1 bg-[#0A0A0A] text-white shrink-0 mt-0.5">
                    <Check size={12} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
                      {perk.title}
                    </h4>
                    <p className="text-[11px] text-[#736E65] font-light leading-relaxed pt-0.5">
                      {perk.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowBenefitsModal(false)}
                className="btn-editorial-primary w-full py-3 text-xs tracking-[0.2em] cursor-pointer"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LOGOUT CONFIRMATION MODAL                                 */}
      {/* ========================================================= */}
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
              aria-label="Close logout modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-[#0A0A0A] text-white shrink-0">
                <LogOut size={22} className="text-amber-400" />
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
              Are you sure you want to log out of your FLINT A account? You will need to sign in again to view your order archive, saved addresses, and active shipments.
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
