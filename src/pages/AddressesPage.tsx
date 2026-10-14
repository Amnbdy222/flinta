import React, { useEffect, useState } from 'react';
import { fetchCustomerAddresses, createAddress, deleteAddress } from '../services/addressService';
import { Address } from '../types/database.types';
import { EmptyState } from '../components/EmptyState';
import { lookupPincode } from '../services/pincodeService';
import { MapPin, Plus, Trash2, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { AccountLayout } from '../components/AccountLayout';
import { sanitizeText, sanitizePhone, sanitizePincode } from '../utils/sanitize';

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

  // Pincode auto-lookup state
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeSuccess, setPincodeSuccess] = useState(false);
  const [detectedAreas, setDetectedAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');

  const handlePincodeChange = async (newVal: string) => {
    const cleaned = newVal.replace(/[^0-9]/g, '').slice(0, 6);
    setPincode(cleaned);
    setPincodeSuccess(false);

    if (cleaned.length === 6) {
      setIsPincodeLoading(true);
      try {
        const details = await lookupPincode(cleaned);
        if (details) {
          if (details.city) setCity(details.city);
          if (details.state) setState(details.state);
          setDetectedAreas(details.areas || []);
          setPincodeSuccess(true);
          if (details.areas?.length === 1 && !line2) {
            setLine2(details.areas[0]);
            setSelectedArea(details.areas[0]);
          }
        } else {
          setDetectedAreas([]);
        }
      } catch (err) {
        console.warn('Pincode lookup error:', err);
      } finally {
        setIsPincodeLoading(false);
      }
    } else {
      setDetectedAreas([]);
    }
  };

  const handleSelectArea = (areaName: string) => {
    setSelectedArea(areaName);
    if (!line2.trim()) {
      setLine2(areaName);
    } else if (!line2.toLowerCase().includes(areaName.toLowerCase())) {
      setLine2(`${line2}, ${areaName}`);
    }
  };

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

    const cleanName = sanitizeText(fullName, 100);
    const cleanPhone = sanitizePhone(phone);
    const cleanLine1 = sanitizeText(line1, 200);
    const cleanLine2 = line2.trim() ? sanitizeText(line2, 200) : null;
    const cleanCity = sanitizeText(city, 80);
    const cleanState = sanitizeText(state, 80);
    const cleanPincode = sanitizePincode(pincode);

    if (!cleanName || !cleanPhone || !cleanLine1 || !cleanCity || !cleanState || cleanPincode.length !== 6) {
      setError('Please provide valid address details (name, 10-digit mobile, address line, city, state, 6-digit PIN code).');
      return;
    }

    try {
      await createAddress({
        full_name: cleanName,
        phone: cleanPhone,
        address_line_1: cleanLine1,
        address_line_2: cleanLine2,
        landmark: null,
        city: cleanCity,
        state: cleanState,
        pincode: cleanPincode,
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
        <div className="bg-white border border-[#EAE8E2] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
          <div>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-[#736E65] block">
              DISPATCH LOCATIONS
            </span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-light uppercase tracking-tight text-[#0A0A0A] mt-0.5">
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
                  <div className="flex items-center justify-between">
                    <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">PINCODE *</label>
                    {isPincodeLoading && (
                      <span className="text-[0.6rem] text-[#736E65] flex items-center gap-1 font-light">
                        <Loader2 size={10} className="animate-spin text-[#0A0A0A]" />
                        <span>Detecting...</span>
                      </span>
                    )}
                    {!isPincodeLoading && pincodeSuccess && (
                      <span className="text-[0.6rem] text-emerald-700 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={10} className="text-emerald-700" />
                        <span>Auto-filled</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="6-digit PIN"
                    className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">CITY *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
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
                    placeholder="State"
                    className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>

              {/* Detected Area / Locality selector */}
              {detectedAreas.length > 0 && (
                <div className="p-3 bg-white border border-[#0A0A0A]/10 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[0.6rem] font-bold tracking-[0.15em] uppercase text-[#0A0A0A] flex items-center gap-1.5">
                      <MapPin size={11} className="text-[#D45A45]" />
                      <span>SELECT AREA / LOCALITY FOR {pincode}:</span>
                    </span>
                    <span className="text-[0.55rem] text-[#736E65] font-light">
                      Tap to add to Address Line 2
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {detectedAreas.map((area) => {
                      const isSelected = selectedArea === area || line2.toLowerCase().includes(area.toLowerCase());
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => handleSelectArea(area)}
                          className={`text-[0.65rem] px-2.5 py-1 border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-xs'
                              : 'bg-[#FAF9F6] text-[#0A0A0A] border-[#0A0A0A]/15 hover:border-[#0A0A0A] hover:bg-white'
                          }`}
                        >
                          {area}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                className="bg-white p-4 sm:p-5 md:p-6 border border-[#EAE8E2] shadow-xs flex flex-col justify-between space-y-3 hover:border-[#0A0A0A] transition-colors"
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
