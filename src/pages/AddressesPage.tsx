import React, { useEffect, useState } from 'react';
import { fetchCustomerAddresses, createAddress, deleteAddress } from '../services/addressService';
import { Address } from '../types/database.types';
import { EmptyState } from '../components/EmptyState';
import { MapPin, Plus, Trash2, AlertCircle } from 'lucide-react';
import { AccountLayout } from '../components/AccountLayout';

export const AddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Error loading addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createAddress({
        full_name: fullName,
        phone,
        address_line_1: line1,
        address_line_2: line2 || null,
        landmark: null,
        city,
        state,
        pincode,
        is_default: addresses.length === 0,
      });
      setIsAdding(false);
      setFullName('');
      setPhone('');
      setLine1('');
      setLine2('');
      setCity('');
      setState('');
      setPincode('');
      await loadAddresses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save address.';
      setError(msg);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress(id);
      await loadAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  return (
    <AccountLayout activeKey="addresses" title="Saved Addresses">
      <div className="space-y-4 sm:space-y-6">

        {/* HEADER */}
        <div className="bg-white p-4 sm:p-6 hairline-all flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
          <div>
            <span className="editorial-subtitle block">DISPATCH LOCATIONS</span>
            <h1 className="font-editorial text-xl sm:text-2xl md:text-3xl font-light uppercase tracking-tight mt-0.5">
              SAVED ADDRESSES ({addresses.length})
            </h1>
          </div>
          {!isAdding && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="btn-editorial-primary text-xs py-2.5 px-4 sm:px-5 inline-flex items-center justify-center space-x-2 self-start sm:self-auto shrink-0 cursor-pointer w-full sm:w-auto"
            >
              <Plus size={14} />
              <span>ADD NEW ADDRESS</span>
            </button>
          )}
        </div>

        {/* ADD ADDRESS FORM */}
        {isAdding && (
          <div className="bg-white p-4 sm:p-6 md:p-8 hairline-all space-y-4 sm:space-y-6">
            <h2 className="font-editorial text-lg sm:text-xl font-light uppercase text-[#0A0A0A] pb-3 hairline-b">
              NEW SHIPPING LOCATION
            </h2>

            {error && (
              <div className="p-3 text-xs bg-red-50 text-red-900 border border-red-900/20 flex items-start space-x-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                    RECIPIENT FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                    PHONE NUMBER *
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                  STREET ADDRESS LINE 1 *
                </label>
                <input
                  type="text"
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="House / Flat No., Street, Building"
                  className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                  STREET ADDRESS LINE 2 <span className="text-[#736E65] normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Area, Locality, Sector"
                  className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              {/* City / State / Pincode — 3 cols on sm, 1 col on mobile */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">CITY *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">STATE *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">PINCODE *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch gap-3">
                <button
                  type="submit"
                  className="btn-editorial-primary text-xs py-2.5 px-6 tracking-[0.2em] cursor-pointer w-full sm:w-auto justify-center"
                >
                  SAVE ADDRESS
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="btn-editorial-outline text-xs py-2.5 px-5 tracking-[0.2em] cursor-pointer w-full sm:w-auto text-center"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ADDRESS LIST */}
        {loading ? (
          <div className="py-12 sm:py-16 text-center text-xs tracking-widest uppercase text-[#736E65] bg-white hairline-all">
            LOADING ADDRESSES...
          </div>
        ) : addresses.length === 0 && !isAdding ? (
          <div className="bg-white py-10 sm:py-12 px-5 sm:px-6 hairline-all">
            <EmptyState
              title="NO SAVED ADDRESSES"
              message="Add your primary shipping location for effortless checkout."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white p-4 sm:p-5 md:p-6 hairline-all flex flex-col justify-between space-y-3 hover:border-[#0A0A0A] transition-colors"
              >
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-editorial text-base sm:text-lg font-medium text-[#0A0A0A] leading-tight">
                      {addr.full_name}
                    </span>
                    {addr.is_default && (
                      <span className="flex-shrink-0 px-2 py-0.5 text-[0.55rem] sm:text-[0.6rem] font-semibold tracking-widest uppercase bg-[#0A0A0A] text-[#FAF9F6]">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#736E65] font-light leading-relaxed">
                    {addr.address_line_1}
                    {addr.address_line_2 ? `, ${addr.address_line_2}` : ''}
                    <br />
                    {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                  <p className="text-[0.65rem] sm:text-[0.7rem] text-[#736E65] font-mono">TEL: {addr.phone}</p>
                </div>

                <div className="pt-2 border-t border-[#0A0A0A]/10 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs text-[#736E65]">
                    <MapPin size={12} />
                    <span className="text-[0.6rem] sm:text-[0.65rem] tracking-wider uppercase">DELIVERY POINT</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="text-red-700 hover:text-red-900 p-1.5 sm:p-1 transition-colors cursor-pointer -mr-1"
                    title="Delete address"
                    aria-label="Delete address"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
};
