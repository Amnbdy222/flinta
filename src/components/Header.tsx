import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, User, Heart, Menu, X, ChevronRight } from 'lucide-react';
import { SearchModal } from './SearchModal';
import { CartDrawer } from './CartDrawer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuthModal } from '../context/AuthModalContext';
import { fetchActiveCategories } from '../services/categoryService';

interface NavCategory {
  name: string;
  slug: string;
}

const DEFAULT_CATEGORIES: NavCategory[] = [
  { name: 'Shirts', slug: 'shirt' },
  { name: 'T-Shirts', slug: 't-shirts' },
  { name: 'Track Pants', slug: 'track-pants' },
  { name: 'Jeans', slug: 'jeans' },
  { name: 'Cargo', slug: 'cargo' },
  { name: 'Hoodies & Jackets', slug: 'hoodies-jackets' },
  { name: 'Linen Pants', slug: 'linen-pant' },
  { name: 'Joggers', slug: 'joggers' },
];

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [categories, setCategories] = useState<NavCategory[]>(DEFAULT_CATEGORIES);

  const { itemCount, openCart } = useCart();
  const { user } = useAuth();
  const { wishlistCount } = useWishlist();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();
  const location = useLocation();

  // Load real active categories from Supabase
  useEffect(() => {
    let isMounted = true;
    fetchActiveCategories().then((cats) => {
      if (!isMounted) return;
      if (cats && cats.length > 0) {
        const mapped = cats.map((c) => ({ name: c.name, slug: c.slug }));
        // Ensure joggers is included if present in catalog
        if (!mapped.some((c) => c.slug === 'joggers')) {
          mapped.push({ name: 'Joggers', slug: 'joggers' });
        }
        setCategories(mapped);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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

      {/* SIDE NAVIGATION DRAWER WITH FULL CATEGORY ARCHIVE */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0A0A0A]/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-[85vw] max-w-sm bg-[#FAF9F6] h-full shadow-2xl flex flex-col justify-between z-10 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 hairline-b shrink-0">
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

            {/* Scrollable Nav links */}
            <nav
              className="flex-1 px-6 pt-5 pb-4 flex flex-col space-y-1 overflow-y-auto no-scrollbar"
              aria-label="Navigation Menu"
            >
              {/* PRIMARY LINKS */}
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center py-3 text-xs font-medium tracking-[0.25em] hover:opacity-60 uppercase hairline-b ${
                  location.pathname === '/' ? 'text-[#0A0A0A] font-bold' : 'text-[#383531]'
                }`}
              >
                HOME
              </Link>

              <Link
                to="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between py-3 text-xs font-medium tracking-[0.25em] hover:opacity-60 uppercase hairline-b ${
                  location.pathname === '/shop' && !location.search
                    ? 'text-[#0A0A0A] font-bold'
                    : 'text-[#383531]'
                }`}
              >
                <span>SHOP ALL</span>
                <span className="text-[10px] text-[#736E65] tracking-widest font-normal">
                  ALL GARMENTS
                </span>
              </Link>

              {/* ALL CATEGORIES SECTION */}
              <div className="pt-3 pb-2">
                <div className="flex items-center justify-between py-1.5 text-[10px] font-bold tracking-[0.25em] uppercase text-[#736E65]">
                  <span>CATEGORIES</span>
                  <span className="text-[9px] bg-[#EAE8E2] px-1.5 py-0.5 text-[#0A0A0A] font-semibold">
                    {categories.length}
                  </span>
                </div>

                <div className="pl-2 space-y-0.5 border-l-2 border-[#0A0A0A]/10 mt-1.5 mb-2">
                  {categories.map((cat) => {
                    const isCatActive =
                      location.pathname === '/shop' &&
                      location.search.includes(`category=${cat.slug}`);
                    return (
                      <Link
                        key={cat.slug}
                        to={`/shop?category=${cat.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between py-2 text-[11px] tracking-[0.2em] uppercase transition-colors group ${
                          isCatActive
                            ? 'text-[#0A0A0A] font-bold'
                            : 'text-[#524E48] hover:text-[#0A0A0A]'
                        }`}
                      >
                        <span className="group-hover:translate-x-1 transition-transform">
                          {cat.name}
                        </span>
                        <ChevronRight
                          size={13}
                          className="text-[#A39E93] group-hover:text-[#0A0A0A] transition-colors"
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* SECONDARY LINKS */}
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center py-3 text-xs font-medium tracking-[0.25em] text-[#383531] hover:opacity-60 uppercase hairline-b"
              >
                ABOUT
              </Link>

              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-3 text-xs font-medium tracking-[0.25em] text-[#0A0A0A] hover:opacity-60 uppercase hairline-b"
              >
                <span>WISHLIST</span>
                {wishlistCount > 0 && (
                  <span className="badge-editorial">{wishlistCount}</span>
                )}
              </Link>

              <Link
                to={user ? '/account' : '#'}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleAccountClick(e);
                }}
                className="flex items-center justify-between py-3 text-xs font-medium tracking-[0.25em] text-[#0A0A0A] hover:opacity-60 uppercase"
              >
                <span>{user ? 'ACCOUNT PORTAL' : 'CLIENT LOGIN'}</span>
                {user && (
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                )}
              </Link>
            </nav>

            {/* Footer */}
            <div className="px-6 py-5 hairline-t space-y-2.5 text-[0.65rem] tracking-widest text-[#736E65] shrink-0 bg-[#FAF9F6]">
              <p>© FLINT ARCHIVE. ALL RIGHTS RESERVED.</p>
              <div className="flex space-x-6">
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
