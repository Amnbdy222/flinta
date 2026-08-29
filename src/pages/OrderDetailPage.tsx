import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchOrderDetail, formatOrderNumber } from '../services/orderService';
import {
  fetchReturnRequest,
  fetchExchangeRequests,
  fetchRefunds,
} from '../services/returnExchangeService';
import { Order, ReturnRequest, ExchangeRequest, Refund } from '../types/database.types';
import { EmptyState } from '../components/EmptyState';
import { ReturnModal } from '../components/ReturnModal';
import { ExchangeModal } from '../components/ExchangeModal';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { useStoreSettings } from '../context/StoreSettingsContext';
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Copy,
  Check,
  RotateCcw,
  RefreshCw,
  DollarSign,
  Clock,
  Ban,
} from 'lucide-react';
import { AccountLayout } from '../components/AccountLayout';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { settings } = useStoreSettings();
  const [order, setOrder] = useState<Order | null>(null);
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [exchangeRequests, setExchangeRequests] = useState<ExchangeRequest[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const orderData = await fetchOrderDetail(id);
      setOrder(orderData);

      if (orderData) {
        const [retData, exchData, refData] = await Promise.all([
          fetchReturnRequest(orderData.id),
          fetchExchangeRequests(orderData.id),
          fetchRefunds(orderData.id),
        ]);

        setReturnRequest(retData);
        setExchangeRequests(exchData);
        setRefunds(refData);
      }
    } catch (err) {
      console.error('Error fetching order detail or return/exchange records:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayOrderNum = formatOrderNumber(order?.order_number);

  const handleCopyOrderNumber = () => {
    if (!displayOrderNum) return;
    navigator.clipboard.writeText(displayOrderNum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 text-center text-xs tracking-widest uppercase text-[#736E65]">
        RETRIEVING ORDER CONFIRMATION SNAPSHOT...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 flex items-center justify-center">
        <EmptyState
          title="ORDER NOT FOUND"
          message="We could not find the requested order record in your archive."
          actionText="RETURN TO MY ORDERS"
          actionPath="/account/orders"
        />
      </div>
    );
  }

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'border-emerald-900/30 text-emerald-900 bg-emerald-50';
      case 'shipped':
      case 'out_for_delivery':
        return 'border-blue-900/30 text-blue-900 bg-blue-50';
      case 'cancelled':
        return 'border-rose-900/30 text-rose-900 bg-rose-50';
      default:
        return 'border-amber-900/30 text-amber-900 bg-amber-50';
    }
  };

  const isEligibleForReturnExchange =
    order.status === 'delivered' || order.status === 'confirmed' || order.status === 'shipped';

  const isCancellable = ['pending', 'confirmed', 'processing'].includes(order.status);

  return (
    <AccountLayout activeKey="orders" title={`Order ${formatOrderNumber(order.order_number)}`}>
      <div className="space-y-4 sm:space-y-6">

        {/* BREADCRUMB */}
        <div>
          <Link
            to="/account/orders"
            className="inline-flex items-center text-[0.65rem] sm:text-xs tracking-[0.2em] text-[#736E65] hover:text-[#0A0A0A] uppercase transition-colors"
          >
            <ArrowLeft size={13} className="mr-1.5" />
            BACK TO ALL ORDERS
          </Link>
        </div>

        {/* ORDER SNAPSHOT CARD (Clean, compact mobile header; editorial desktop) */}
        <div className="p-3.5 sm:p-6 bg-white hairline-all space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div>
              <span className="text-[0.6rem] sm:text-[0.65rem] font-medium tracking-[0.25em] text-[#736E65] uppercase block">
                ORDER CONFIRMATION SNAPSHOT
              </span>
              <h1 className="font-editorial text-lg sm:text-2xl md:text-3xl font-normal tracking-tight text-[#0A0A0A] mt-0.5">
                ORDER #{displayOrderNum}
              </h1>
            </div>

            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="inline-flex items-center space-x-1 bg-[#F0EFEA] hover:bg-[#0A0A0A] hover:text-[#FAF9F6] text-[0.6rem] sm:text-[0.65rem] tracking-widest font-mono uppercase px-2.5 py-1.5 hairline-all transition-colors cursor-pointer shrink-0"
              title="Copy Order ID"
            >
              {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
              <span>{copied ? 'COPIED' : 'COPY ID'}</span>
            </button>
          </div>

          <p className="text-[0.65rem] sm:text-xs text-[#736E65] font-light tracking-wider">
            PLACED ON {formattedDate.toUpperCase()}
          </p>

          {/* Status Badges & Actions */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2.5 hairline-t">
            <span className={`px-2.5 py-1 text-[0.6rem] sm:text-xs tracking-wider uppercase font-medium border ${getStatusBadge(order.status)}`}>
              STATUS: {order.status.toUpperCase()}
            </span>
            <span className="px-2.5 py-1 text-[0.6rem] sm:text-xs tracking-wider uppercase font-medium border border-blue-900/30 text-blue-900 bg-blue-50">
              PAYMENT: {order.payment_status.toUpperCase()}
            </span>
            {isCancellable && (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="inline-flex items-center space-x-1 bg-rose-50 text-rose-900 border border-rose-900/30 hover:bg-rose-900 hover:text-white text-[0.6rem] sm:text-xs uppercase tracking-wider font-medium px-2.5 py-1 sm:px-3 sm:py-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Ban size={11} />
                <span>CANCEL ORDER</span>
              </button>
            )}
          </div>
        </div>

        {/* CANCELLED NOTICE */}
        {order.status === 'cancelled' && (
          <div className="p-3.5 sm:p-5 bg-rose-50 border border-rose-900/20 flex items-start space-x-3 text-rose-950">
            <Ban size={18} className="text-rose-900 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <h3 className="font-editorial text-sm sm:text-lg font-medium uppercase tracking-tight">THIS ORDER HAS BEEN CANCELLED</h3>
              <p className="text-[0.68rem] sm:text-xs font-light text-rose-900/80 leading-relaxed">
                Reserved items have been released back to active inventory. If payment was made, a refund will be processed.
              </p>
            </div>
          </div>
        )}

        {/* RETURN / EXCHANGE ACTION BAR */}
        {isEligibleForReturnExchange && (
          <div className="p-3.5 sm:p-6 bg-[#F0EFEA] hairline-all flex flex-col gap-3 sm:gap-4">
            <div className="space-y-0.5 sm:space-y-1">
              <h3 className="font-editorial text-sm sm:text-lg text-[#0A0A0A] uppercase tracking-wide">
                NEED A RETURN OR GARMENT EXCHANGE?
              </h3>
              <p className="text-[0.68rem] sm:text-xs text-[#736E65] font-light">
                Delivered orders are eligible for complimentary exchanges or full returns.
              </p>
            </div>
            <div className="flex flex-col xs:flex-row flex-wrap gap-2 sm:gap-3">
              {!returnRequest && (
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(true)}
                  className="inline-flex items-center justify-center space-x-2 bg-transparent border border-[#0A0A0A] px-4 py-2.5 sm:py-2 text-[0.65rem] sm:text-xs uppercase tracking-widest font-medium text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FAF9F6] transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>REQUEST RETURN</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setExchangeModalOpen(true)}
                className="inline-flex items-center justify-center space-x-2 bg-[#0A0A0A] text-[#FAF9F6] border border-[#0A0A0A] px-4 py-2.5 sm:py-2 text-[0.65rem] sm:text-xs uppercase tracking-widest font-medium hover:bg-transparent hover:text-[#0A0A0A] transition-colors"
              >
                <RefreshCw size={13} />
                <span>EXCHANGE GARMENT</span>
              </button>
            </div>
          </div>
        )}

        {/* RETURN REQUEST CARD */}
        {returnRequest && (
          <div className="bg-white hairline-all p-3.5 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 hairline-b">
              <div className="flex items-center space-x-2 text-[#0A0A0A]">
                <RotateCcw size={15} />
                <h3 className="font-editorial text-sm sm:text-lg uppercase tracking-wide">RETURN REQUEST</h3>
              </div>
              <span className="px-2 py-0.5 text-[0.6rem] sm:text-xs border border-amber-900/30 text-amber-900 bg-amber-50 uppercase font-medium">
                {returnRequest.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 text-xs font-light text-[#383531]">
              <div>
                <span className="text-[0.62rem] sm:text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">REASON</span>
                <p className="font-normal text-[#0A0A0A]">{returnRequest.reason}</p>
              </div>
              {returnRequest.refund_amount && (
                <div>
                  <span className="text-[0.62rem] sm:text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">ESTIMATED REFUND</span>
                  <p className="font-normal text-[#0A0A0A]">₹{Number(returnRequest.refund_amount).toFixed(2)}</p>
                </div>
              )}
              {returnRequest.description && (
                <div className="sm:col-span-2">
                  <span className="text-[0.62rem] sm:text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">REMARKS</span>
                  <p className="font-normal text-[#0A0A0A]">{returnRequest.description}</p>
                </div>
              )}
              {returnRequest.admin_note && (
                <div className="sm:col-span-2 bg-[#F0EFEA] p-2.5 sm:p-3 hairline-all text-xs">
                  <span className="text-[0.62rem] sm:text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">ADMIN NOTE</span>
                  <p className="font-normal text-[#0A0A0A]">{returnRequest.admin_note}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXCHANGE REQUEST CARDS */}
        {exchangeRequests.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-editorial text-sm sm:text-xl uppercase tracking-wide text-[#0A0A0A] pb-2 hairline-b">
              EXCHANGE REQUESTS ({exchangeRequests.length})
            </h3>
            {exchangeRequests.map((ex) => (
              <div key={ex.id} className="bg-white hairline-all p-3.5 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 hairline-b">
                  <div className="flex items-center space-x-2 text-[#0A0A0A]">
                    <RefreshCw size={15} />
                    <span className="font-editorial text-sm sm:text-lg uppercase tracking-wide">EXCHANGE REQUEST</span>
                  </div>
                  <span className="px-2 py-0.5 text-[0.6rem] sm:text-xs border border-indigo-900/30 text-indigo-900 bg-indigo-50 uppercase font-medium">
                    {ex.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 text-xs font-light text-[#383531]">
                  <div>
                    <span className="text-[0.62rem] sm:text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">REASON</span>
                    <p className="font-normal text-[#0A0A0A]">{ex.reason}</p>
                  </div>
                  <div>
                    <span className="text-[0.62rem] sm:text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">REPLACEMENT VARIANT</span>
                    <p className="font-normal text-[#0A0A0A]">
                      {ex.requested_variant
                        ? `${ex.requested_variant.color_name} • SIZE ${ex.requested_variant.size}`
                        : 'Variant Registered'}
                    </p>
                  </div>
                  {ex.admin_note && (
                    <div className="sm:col-span-2 bg-[#F0EFEA] p-2.5 sm:p-3 hairline-all text-xs">
                      <span className="text-[0.62rem] sm:text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">ADMIN NOTE</span>
                      <p className="font-normal text-[#0A0A0A]">{ex.admin_note}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REFUNDS */}
        {refunds.length > 0 && (
          <div className="bg-white hairline-all p-3.5 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2 text-[#0A0A0A] pb-2.5 hairline-b">
              <DollarSign size={15} />
              <h3 className="font-editorial text-sm sm:text-lg uppercase tracking-wide">REFUND STATUS</h3>
            </div>
            {refunds.map((ref) => (
              <div key={ref.id} className="flex flex-col xs:flex-row justify-between items-start xs:items-center text-xs gap-2">
                <div>
                  <span className="font-medium text-[#0A0A0A]">₹{Number(ref.amount).toFixed(2)}</span>
                  {ref.provider_refund_id && (
                    <span className="text-[#736E65] ml-2 text-[0.65rem]">ID: {ref.provider_refund_id}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={12} className="text-[#736E65]" />
                  <span className="px-2 py-0.5 text-[0.6rem] sm:text-xs border border-emerald-900/30 text-emerald-900 bg-emerald-50 uppercase font-medium">
                    {ref.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDER ITEMS */}
        <div className="space-y-3 sm:space-y-6">
          <h2 className="font-editorial text-base sm:text-2xl uppercase tracking-wide text-[#0A0A0A] pb-2 hairline-b">
            PURCHASED GARMENTS
          </h2>
          <div className="space-y-2.5 sm:space-y-4">
            {order.order_items?.map((item) => (
              <div
                key={item.id}
                className="p-3 sm:p-5 md:p-6 bg-white hairline-all"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* IMAGE */}
                  <Link
                    to={`/products/${item.product_slug || item.product?.slug || 'garment'}`}
                    className="w-16 h-20 sm:w-20 sm:h-24 bg-[#F0EFEA] overflow-hidden hairline-all flex-shrink-0 relative group/img block"
                    title={item.product_name_snapshot}
                  >
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop'}
                      alt={item.product_name_snapshot}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                    />
                  </Link>

                  {/* DETAILS */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                    <div>
                      <Link
                        to={`/products/${item.product_slug || item.product?.slug || 'garment'}`}
                        className="font-editorial text-sm sm:text-lg md:text-xl text-[#0A0A0A] font-medium hover:opacity-75 transition-opacity block leading-snug truncate"
                      >
                        {item.product_name_snapshot}
                      </Link>
                      <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-[0.6rem] sm:text-[0.65rem] tracking-wider text-[#736E65] uppercase mt-0.5">
                        <span>{item.color_name_snapshot}</span>
                        <span>•</span>
                        <span>SZ {item.size_snapshot}</span>
                      </div>
                    </div>

                    {/* Price row — clean inline display */}
                    <div className="flex items-baseline justify-between mt-2 pt-1.5 hairline-t">
                      <span className="text-[0.68rem] sm:text-xs text-[#736E65]">
                        ₹{Number(item.unit_price).toFixed(2)} × {item.quantity}
                      </span>
                      <span className="text-xs sm:text-base font-semibold text-[#0A0A0A] tracking-wider">
                        ₹{Number(item.total_price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SHIPPING + PAYMENT SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 md:gap-8 pt-1">
          {/* SHIPPING */}
          <div className="bg-white hairline-all p-3.5 sm:p-6 space-y-3 sm:space-y-5">
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-[0.65rem] sm:text-xs font-semibold tracking-[0.2em] text-[#0A0A0A] uppercase">
                <MapPin size={13} className="text-[#736E65]" />
                <span>SHIPPING ADDRESS</span>
              </div>
              <div className="text-xs text-[#383531] font-light leading-relaxed pl-5 space-y-0.5">
                <p className="font-medium text-[#0A0A0A]">{order.shipping_name}</p>
                <p className="text-[#736E65] text-[0.68rem]">{order.shipping_phone}</p>
                <p className="text-[#383531]">{order.shipping_address_line_1}</p>
                {order.shipping_address_line_2 && <p className="text-[#383531]">{order.shipping_address_line_2}</p>}
                <p className="text-[#383531]">{order.shipping_city}, {order.shipping_state} {order.shipping_pincode}</p>
              </div>
            </div>
            <div className="space-y-1.5 hairline-t pt-2.5">
              <div className="flex items-center space-x-1.5 text-[0.65rem] sm:text-xs font-semibold tracking-[0.2em] text-[#0A0A0A] uppercase">
                <CreditCard size={13} className="text-[#736E65]" />
                <span>PAYMENT METHOD</span>
              </div>
              <p className="text-xs text-[#383531] font-light pl-5 uppercase">
                {order.payment_method === 'cod' ? 'CASH ON DELIVERY (COD)' : 'RAZORPAY SECURE'}
              </p>
            </div>
          </div>

          {/* TOTALS */}
          <div className="bg-white hairline-all p-3.5 sm:p-6 space-y-3">
            <h3 className="font-editorial text-sm sm:text-lg uppercase tracking-wide text-[#0A0A0A] pb-2 hairline-b">
              PAYMENT BREAKDOWN
            </h3>
            <div className="space-y-2 text-xs font-light text-[#383531]">
              <div className="flex justify-between">
                <span className="text-[0.62rem] sm:text-[0.65rem] tracking-[0.18em] uppercase text-[#736E65]">SUBTOTAL</span>
                <span className="tracking-wider text-[#0A0A0A]">{settings.currency_symbol}{Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-900">
                  <span className="text-[0.62rem] sm:text-[0.65rem] tracking-[0.18em] uppercase font-medium">DISCOUNT</span>
                  <span className="tracking-wider font-medium">-{settings.currency_symbol}{Number(order.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[0.62rem] sm:text-[0.65rem] tracking-[0.18em] uppercase text-[#736E65]">SHIPPING</span>
                <span className="tracking-wider text-[#0A0A0A]">
                  {Number(order.shipping_amount) === 0 ? 'COMPLIMENTARY' : `${settings.currency_symbol}${Number(order.shipping_amount).toFixed(2)}`}
                </span>
              </div>
              <div className="pt-2.5 hairline-t flex justify-between items-baseline">
                <span className="text-[0.68rem] sm:text-[0.7rem] font-semibold tracking-[0.2em] uppercase text-[#0A0A0A]">TOTAL AMOUNT</span>
                <span className="text-base sm:text-xl font-semibold text-[#0A0A0A] tracking-wider">
                  {settings.currency_symbol}{Number(order.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <ReturnModal order={order} isOpen={returnModalOpen} onClose={() => setReturnModalOpen(false)} onSuccess={loadData} />
      <ExchangeModal order={order} isOpen={exchangeModalOpen} onClose={() => setExchangeModalOpen(false)} onSuccess={loadData} />
      <CancelOrderModal order={order} isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} onSuccess={loadData} />
    </AccountLayout>
  );
};
