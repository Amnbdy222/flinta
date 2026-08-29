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
        return 'border-red-900/30 text-red-900 bg-red-50';
      default:
        return 'border-amber-900/30 text-amber-900 bg-amber-50';
    }
  };

  const isEligibleForReturnExchange =
    order.status === 'delivered' || order.status === 'confirmed' || order.status === 'shipped';

  const isCancellable = ['pending', 'confirmed', 'processing'].includes(order.status);

  return (
    <AccountLayout activeKey="orders" title={`Order ${formatOrderNumber(order.order_number)}`}>
      <div className="space-y-6">

        {/* BREADCRUMB */}
        <div>
          <Link
            to="/account/orders"
            className="inline-flex items-center text-xs tracking-[0.25em] text-[#736E65] hover:text-[#0A0A0A] uppercase transition-colors"
          >
            <ArrowLeft size={14} className="mr-2" />
            BACK TO ALL ORDERS
          </Link>
        </div>

        {/* ORDER TITLE & STATUS */}
        <div className="pb-6 sm:pb-8 hairline-b flex flex-col gap-4">
          <div className="space-y-2">
            <span className="editorial-subtitle block">ORDER CONFIRMATION SNAPSHOT</span>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="font-sans text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide text-[#0A0A0A]">
                ORDER #{displayOrderNum}
              </h1>
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                className="inline-flex items-center space-x-1.5 bg-[#F0EFEA] hover:bg-[#0A0A0A] hover:text-[#FAF9F6] text-[0.65rem] tracking-widest font-sans font-medium uppercase px-3 py-1.5 hairline-all transition-colors cursor-pointer"
                title="Copy Order ID"
              >
                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copied ? 'COPIED' : 'COPY ID'}</span>
              </button>
            </div>
            <p className="text-xs text-[#736E65] font-light tracking-wider">
              PLACED ON {formattedDate.toUpperCase()}
            </p>
          </div>

          {/* Status badges + cancel */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge-editorial ${getStatusBadge(order.status)}`}>
              STATUS: {order.status.toUpperCase()}
            </span>
            <span className="badge-editorial border-blue-900/30 text-blue-900 bg-blue-50">
              PAYMENT: {order.payment_status.toUpperCase()}
            </span>
            {isCancellable && (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-rose-50 text-rose-900 border border-rose-900/30 hover:bg-rose-900 hover:text-white text-xs uppercase tracking-widest font-medium px-3 sm:px-4 py-1.5 sm:py-2 transition-colors cursor-pointer"
              >
                <Ban size={13} />
                <span>CANCEL ORDER</span>
              </button>
            )}
          </div>
        </div>

        {/* CANCELLED NOTICE */}
        {order.status === 'cancelled' && (
          <div className="p-4 sm:p-6 bg-rose-50 border border-rose-900/20 flex items-start sm:items-center space-x-3 sm:space-x-4 text-rose-950">
            <Ban size={20} className="text-rose-900 shrink-0 mt-0.5 sm:mt-0" />
            <div className="space-y-1">
              <h3 className="font-editorial text-lg sm:text-xl font-normal uppercase">THIS ORDER HAS BEEN CANCELLED</h3>
              <p className="text-xs font-light text-rose-900/80 leading-relaxed">
                Reserved items have been released back to active inventory. If payment was made, a refund will be processed.
              </p>
            </div>
          </div>
        )}

        {/* RETURN / EXCHANGE ACTION BAR */}
        {isEligibleForReturnExchange && (
          <div className="p-4 sm:p-6 bg-[#F0EFEA] hairline-all flex flex-col gap-4">
            <div className="space-y-1">
              <h3 className="font-editorial text-base sm:text-lg text-[#0A0A0A] uppercase tracking-wide">
                NEED A RETURN OR GARMENT EXCHANGE?
              </h3>
              <p className="text-xs text-[#736E65] font-light">
                Delivered orders are eligible for complimentary exchanges or full returns.
              </p>
            </div>
            <div className="flex flex-col xs:flex-row flex-wrap gap-2 sm:gap-3">
              {!returnRequest && (
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(true)}
                  className="inline-flex items-center justify-center space-x-2 bg-transparent border border-[#0A0A0A] px-4 py-2.5 sm:py-2 text-xs uppercase tracking-widest font-medium text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FAF9F6] transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>REQUEST RETURN</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setExchangeModalOpen(true)}
                className="inline-flex items-center justify-center space-x-2 bg-[#0A0A0A] text-[#FAF9F6] border border-[#0A0A0A] px-4 py-2.5 sm:py-2 text-xs uppercase tracking-widest font-medium hover:bg-transparent hover:text-[#0A0A0A] transition-colors"
              >
                <RefreshCw size={13} />
                <span>EXCHANGE GARMENT</span>
              </button>
            </div>
          </div>
        )}

        {/* RETURN REQUEST CARD */}
        {returnRequest && (
          <div className="bg-[#FAF9F6] hairline-all p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 hairline-b">
              <div className="flex items-center space-x-2 text-[#0A0A0A]">
                <RotateCcw size={16} />
                <h3 className="font-editorial text-base sm:text-lg uppercase tracking-wide">RETURN REQUEST</h3>
              </div>
              <span className="badge-editorial border-amber-900/30 text-amber-900 bg-amber-50 uppercase">
                {returnRequest.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs font-light text-[#383531]">
              <div>
                <span className="text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">REASON</span>
                <p className="font-normal text-[#0A0A0A]">{returnRequest.reason}</p>
              </div>
              {returnRequest.refund_amount && (
                <div>
                  <span className="text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">ESTIMATED REFUND</span>
                  <p className="font-normal text-[#0A0A0A]">₹{Number(returnRequest.refund_amount).toFixed(2)}</p>
                </div>
              )}
              {returnRequest.description && (
                <div className="sm:col-span-2">
                  <span className="text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">REMARKS</span>
                  <p className="font-normal text-[#0A0A0A]">{returnRequest.description}</p>
                </div>
              )}
              {returnRequest.admin_note && (
                <div className="sm:col-span-2 bg-[#F0EFEA] p-3 hairline-all text-xs">
                  <span className="text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">ADMIN NOTE</span>
                  <p className="font-normal text-[#0A0A0A]">{returnRequest.admin_note}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXCHANGE REQUEST CARDS */}
        {exchangeRequests.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-editorial text-lg sm:text-xl uppercase tracking-wide text-[#0A0A0A] pb-2 hairline-b">
              EXCHANGE REQUESTS ({exchangeRequests.length})
            </h3>
            {exchangeRequests.map((ex) => (
              <div key={ex.id} className="bg-[#FAF9F6] hairline-all p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 hairline-b">
                  <div className="flex items-center space-x-2 text-[#0A0A0A]">
                    <RefreshCw size={16} />
                    <span className="font-editorial text-base sm:text-lg uppercase tracking-wide">EXCHANGE REQUEST</span>
                  </div>
                  <span className="badge-editorial border-indigo-900/30 text-indigo-900 bg-indigo-50 uppercase">
                    {ex.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs font-light text-[#383531]">
                  <div>
                    <span className="text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">REASON</span>
                    <p className="font-normal text-[#0A0A0A]">{ex.reason}</p>
                  </div>
                  <div>
                    <span className="text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">REPLACEMENT VARIANT</span>
                    <p className="font-normal text-[#0A0A0A]">
                      {ex.requested_variant
                        ? `${ex.requested_variant.color_name} • SIZE ${ex.requested_variant.size}`
                        : 'Variant Registered'}
                    </p>
                  </div>
                  {ex.admin_note && (
                    <div className="sm:col-span-2 bg-[#F0EFEA] p-3 hairline-all text-xs">
                      <span className="text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-0.5">ADMIN NOTE</span>
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
          <div className="bg-[#FAF9F6] hairline-all p-4 sm:p-6 space-y-4">
            <div className="flex items-center space-x-2 text-[#0A0A0A] pb-3 hairline-b">
              <DollarSign size={16} />
              <h3 className="font-editorial text-base sm:text-lg uppercase tracking-wide">REFUND STATUS</h3>
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
                  <span className="badge-editorial border-emerald-900/30 text-emerald-900 bg-emerald-50 uppercase">
                    {ref.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDER ITEMS */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="font-editorial text-xl sm:text-2xl uppercase tracking-wide text-[#0A0A0A] pb-2 hairline-b">
            PURCHASED GARMENTS
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {order.order_items?.map((item) => (
              <div
                key={item.id}
                className="p-3 sm:p-5 md:p-6 bg-[#FAF9F6] hairline-all"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* IMAGE */}
                  <Link
                    to={`/products/${item.product_slug || item.product?.slug || 'garment'}`}
                    className="w-14 h-18 sm:w-16 sm:h-20 md:w-20 md:h-24 bg-[#F0EFEA] overflow-hidden hairline-all flex-shrink-0 relative group/img block"
                    style={{ minHeight: '72px' }}
                    title={item.product_name_snapshot}
                  >
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop'}
                      alt={item.product_name_snapshot}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                    />
                  </Link>

                  {/* DETAILS */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5 sm:gap-2">
                    <Link
                      to={`/products/${item.product_slug || item.product?.slug || 'garment'}`}
                      className="font-editorial text-base sm:text-lg md:text-xl text-[#0A0A0A] font-normal hover:opacity-75 transition-opacity block leading-tight"
                    >
                      {item.product_name_snapshot}
                    </Link>
                    <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-[0.6rem] sm:text-[0.65rem] tracking-widest text-[#736E65] uppercase">
                      <span>{item.color_name_snapshot}</span>
                      <span>•</span>
                      <span>SZ {item.size_snapshot}</span>
                      {item.sku_snapshot && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">SKU: {item.sku_snapshot}</span>
                        </>
                      )}
                    </div>

                    {/* Price row — stays inline on all sizes */}
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xs text-[#736E65]">
                        ₹{Number(item.unit_price).toFixed(2)} × {item.quantity}
                      </span>
                      <span className="text-sm sm:text-base font-light text-[#0A0A0A] tracking-wider">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 pt-2">
          {/* SHIPPING */}
          <div className="bg-[#FAF9F6] hairline-all p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-medium tracking-[0.2em] text-[#0A0A0A] uppercase">
                <MapPin size={15} />
                <span>SHIPPING ADDRESS</span>
              </div>
              <div className="text-xs text-[#383531] font-light leading-relaxed pl-5 space-y-0.5">
                <p className="font-normal text-[#0A0A0A]">{order.shipping_name}</p>
                <p>{order.shipping_phone}</p>
                <p>{order.shipping_address_line_1}</p>
                {order.shipping_address_line_2 && <p>{order.shipping_address_line_2}</p>}
                <p>{order.shipping_city}, {order.shipping_state} {order.shipping_pincode}</p>
              </div>
            </div>
            <div className="space-y-3 hairline-t pt-3 sm:pt-4">
              <div className="flex items-center space-x-2 text-xs font-medium tracking-[0.2em] text-[#0A0A0A] uppercase">
                <CreditCard size={15} />
                <span>PAYMENT METHOD</span>
              </div>
              <p className="text-xs text-[#383531] font-light pl-5 uppercase">
                {order.payment_method === 'cod' ? 'CASH ON DELIVERY' : 'RAZORPAY SECURE'}
              </p>
            </div>
          </div>

          {/* TOTALS */}
          <div className="bg-[#FAF9F6] hairline-all p-4 sm:p-6 space-y-4">
            <h3 className="font-editorial text-lg sm:text-xl uppercase tracking-wide text-[#0A0A0A] pb-3 hairline-b">
              PAYMENT BREAKDOWN
            </h3>
            <div className="space-y-2.5 sm:space-y-3 text-xs font-light text-[#383531]">
              <div className="flex justify-between">
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">SUBTOTAL</span>
                <span className="tracking-wider text-[#0A0A0A]">₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-900">
                  <span className="text-[0.65rem] tracking-[0.2em] uppercase">DISCOUNT</span>
                  <span className="tracking-wider">-₹{Number(order.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">SHIPPING</span>
                <span className="tracking-wider text-[#0A0A0A]">
                  {Number(order.shipping_amount) === 0 ? 'COMPLIMENTARY' : `₹${Number(order.shipping_amount).toFixed(2)}`}
                </span>
              </div>
              <div className="pt-3 hairline-t flex justify-between items-baseline">
                <span className="text-[0.7rem] font-medium tracking-[0.25em] uppercase text-[#0A0A0A]">TOTAL PAID</span>
                <span className="text-lg sm:text-xl font-normal text-[#0A0A0A] tracking-wider">
                  ₹{Number(order.total_amount).toFixed(2)}
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
