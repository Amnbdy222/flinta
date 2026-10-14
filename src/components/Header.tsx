import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Heart, Menu, X } from 'lucide-react';
import { SearchModal } from './SearchModal';
import { CartDrawer } from './CartDrawer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuthModal } from '../context/AuthModalContext';

interface MegaCategoryItem {
  name: string;
  path: string;
  bold?: boolean;
  isRed?: boolean;
  badge?: string;
}

const CATEGORY_COLUMNS: MegaCategoryItem[][] = [
  // Column 1
  [
    { name: 'ALL', path: '/shop', bold: true },
    { name: 'OUTERWEAR', path: '/shop?category=hoodies-jackets' },
    { name: 'JEANS', path: '/shop?category=jeans' },
    { name: 'CARGO PANTS', path: '/shop?category=cargo' },
    { name: 'OVERSHIRTS', path: '/shop?category=shirt' },
    { name: 'ACCESSORIES', path: '/shop?category=accessories' },
    { name: 'SUNGLASSES', path: '/shop?category=sunglasses', badge: 'AT ₹ 999' },
    { name: 'FLINT PLUS', path: '/shop?size=XL', badge: '3XL - 6XL' },
    { name: 'PRICE DROP', path: '/shop?sort=price_low_high', isRed: true },
  ],
  // Column 2
  [
    { name: 'SHOP ALL', path: '/shop' },
    { name: 'SHIRTS', path: '/shop?category=shirt' },
    { name: 'TROUSERS', path: '/shop?category=track-pants' },
    { name: 'JOGGERS', path: '/shop?category=joggers' },
    { name: 'LUGGAGE', path: '/shop?category=luggage' },
    { name: 'BAGS', path: '/shop?category=bags' },
    { name: 'LINEN EDIT', path: '/shop?category=linen-pant' },
    { name: 'FLINT LUXE', path: '/shop?sort=price_high_low', badge: 'PREMIUM' },
    { name: 'FESTIVE EDIT', path: '/shop?category=festive' },
  ],
  // Column 3
  [
    { name: 'BESTSELLERS', path: '/shop?sort=bestseller' },
    { name: 'T-SHIRTS | POLO', path: '/shop?category=t-shirts' },
    { name: 'FOOTWEAR', path: '/shop?category=footwear' },
    { name: 'SHORTS', path: '/shop?category=shorts' },
    { name: 'PERFUMES', path: '/shop?category=perfumes', badge: 'FLAT 50% OFF' },
    { name: 'BELTS', path: '/shop?category=belts' },
    { name: 'BASICS | CORE LAB', path: '/shop?category=basics' },
    { name: 'CELEB COLLABS', path: '/shop?category=collabs' },
  ],
];

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const { itemCount, openCart } = useCart();
  const { user } = useAuth();
  const { wishlistCount } = useWishlist();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();

  const handleAccountClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      openAuthModal({
        mode: 'login',
        title: 'CLIENT PORTAL ACCESS',
        onSuccess: () => navigate('/account'),
      });
    }
  };

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-40 bg-[#FAF9F6] border-b border-[#0A0A0A]/10 h-16 sm:h-18 flex items-center shadow-xs">
        <div className="container-editorial w-full flex items-center justify-between gap-4">
          
          {/* LEFT: HAMBURGER MENU & SEARCH INPUT */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Hamburger button (Mobile & Desktop) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-[#0A0A0A] hover:opacity-60 transition-opacity focus:outline-none cursor-pointer"
              aria-label="Open menu drawer"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>

            {/* Quick Search Bar Input Box */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="hidden md:flex items-center space-x-2.5 bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3.5 py-1.5 text-xs text-[#736E65] hover:border-[#0A0A0A] transition-all w-52 lg:w-64 cursor-pointer"
            >
              <Search size={14} className="text-[#0A0A0A] shrink-0" />
              <span className="truncate uppercase text-[0.65rem] tracking-wider font-light text-[#736E65]">
                SEARCH "SHIRTS, JEANS, OVERSIZED..."
              </span>
            </button>
          </div>

          {/* CENTER: BRAND LOGO ICON & FLINT A TEXT */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto">
            <Link
              to="/"
              className="flex items-center space-x-1.5 sm:space-x-3 transition-opacity hover:opacity-85 focus:outline-none py-1"
              aria-label="FLINT A Home"
            >
              <img
                src="/image.png"
                alt="FLINT A Logo"
                className="h-7 sm:h-9 md:h-10 w-auto object-contain shrink-0 rounded-full shadow-xs"
              />
              <span className="font-brand text-[0.75rem] xs:text-[0.85rem] sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-[0.1em] sm:tracking-[0.25em] text-[#000000] uppercase whitespace-nowrap">
                FLINT A
              </span>
            </Link>
          </div>

          {/* RIGHT UTILITIES */}
          <div className="flex items-center space-x-1 sm:space-x-3 md:space-x-4">
            {/* Search Icon (Mobile) */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="p-1 sm:p-1.5 text-[#0A0A0A] hover:opacity-60 transition-opacity md:hidden focus:outline-none cursor-pointer"
              aria-label="Search storefront"
            >
              <Search size={16} strokeWidth={1.5} />
            </button>

            {/* Account Icon */}
            <Link
              to={user ? '/account' : '#'}
              onClick={handleAccountClick}
              className="p-1 sm:p-1.5 text-[#0A0A0A] hover:opacity-60 transition-opacity focus:outline-none relative"
              aria-label={user ? 'Account Portal' : 'Client Login'}
            >
              <User size={16} strokeWidth={1.5} />
              {user && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-600 rounded-full" />
              )}
            </Link>

            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              className="p-1 sm:p-1.5 text-[#0A0A0A] hover:opacity-60 transition-opacity focus:outline-none relative"
              aria-label={`Wishlist (${wishlistCount} items)`}
            >
              <Heart size={16} strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#0A0A0A] text-[#FAF9F6] rounded-full text-[0.55rem] font-semibold flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon & Badge */}
            <button
              type="button"
              onClick={openCart}
              className="p-1 sm:p-1.5 text-[#0A0A0A] hover:opacity-60 transition-opacity relative focus:outline-none cursor-pointer"
              aria-label={`Shopping Cart (${itemCount} items)`}
            >
              <ShoppingBag size={16} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#0A0A0A] text-[#FAF9F6] rounded-full text-[0.55rem] font-semibold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* SEARCH MODAL OVERLAY */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* CART SLIDE-IN DRAWER */}
      <CartDrawer />

      {/* SNITCH-STYLE MEGA CATEGORY DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0A0A0A]/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#EAE8E2] shrink-0 bg-white">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2"
              >
                <img
                  src="/image.png"
                  alt="FLINT A"
                  className="h-7 w-auto object-contain shrink-0 rounded-full"
                />
                <span className="font-brand text-xl font-bold tracking-[0.22em] text-[#000000] uppercase">
                  FLINT A
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 text-[#0A0A0A] hover:opacity-60 cursor-pointer"
                aria-label="Close menu"
              >
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>

            {/* Scrollable Category Grid Body */}
            <div className="flex-1 p-6 sm:p-8 md:p-10 overflow-y-auto no-scrollbar space-y-6 bg-white">
              {/* 3-COLUMN CATEGORY GRID (EXACT SNITCH REPLICA) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 sm:gap-x-8 md:gap-x-12 gap-y-4 sm:gap-y-5">
                {CATEGORY_COLUMNS.map((col, colIdx) => (
                  <div key={colIdx} className="space-y-3.5 sm:space-y-4">
                    {col.map((item, itemIdx) => (
                      <div key={itemIdx}>
                        <Link
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`inline-flex items-center flex-wrap gap-1.5 py-0.5 text-xs sm:text-[13px] md:text-sm tracking-tight uppercase hover:opacity-60 transition-opacity ${
                            item.bold
                              ? 'font-extrabold text-[#0A0A0A]'
                              : item.isRed
                              ? 'text-[#8E1C20] font-semibold'
                              : 'text-[#0A0A0A] font-normal'
                          }`}
                        >
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="bg-[#78181C] text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 tracking-wider rounded-none shrink-0 uppercase leading-none">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* QUICK UTILITY PORTAL BAR */}
              <div className="pt-6 border-t border-[#EAE8E2] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tracking-wider uppercase font-semibold text-[#0A0A0A]">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:opacity-60 py-1"
                >
                  HOME
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:opacity-60 py-1"
                >
                  ABOUT
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:opacity-60 py-1 flex items-center space-x-1.5"
                >
                  <span>WISHLIST</span>
                  {wishlistCount > 0 && (
                    <span className="badge-editorial text-[9px]">{wishlistCount}</span>
                  )}
                </Link>
                <Link
                  to={user ? '/account' : '#'}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleAccountClick(e);
                  }}
                  className="hover:opacity-60 py-1 flex items-center space-x-1.5"
                >
                  <span>{user ? 'ACCOUNT PORTAL' : 'CLIENT LOGIN'}</span>
                  {user && <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />}
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#EAE8E2] flex flex-wrap items-center justify-between gap-3 text-[10px] tracking-widest text-[#736E65] shrink-0 bg-[#FAF9F6]">
              <p>© FLINT ARCHIVE. ALL RIGHTS RESERVED.</p>
              <div className="flex space-x-5">
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-[#0A0A0A] transition-colors"
                >
                  CLIENT SERVICES
                </Link>
                <Link
                  to="/terms"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-[#0A0A0A] transition-colors"
                >
                  LEGAL
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
