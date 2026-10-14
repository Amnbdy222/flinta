import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchCustomerReturnRequests,
  fetchCustomerExchangeRequests,
  fetchCustomerRefunds,
  CustomerReturnWithOrder,
  CustomerExchangeWithOrder,
  CustomerRefundWithOrder,
} from '../services/returnExchangeService';
import { formatOrderNumber } from '../services/orderService';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { RotateCcw, RefreshCw, DollarSign, ArrowRight, ShieldCheck } from 'lucide-react';
import { AccountLayout } from '../components/AccountLayout';

export const AccountReturnsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'returns' | 'exchanges' | 'refunds'>('returns');
  const [returns, setReturns] = useState<CustomerReturnWithOrder[]>([]);
  const [exchanges, setExchanges] = useState<CustomerExchangeWithOrder[]>([]);
  const [refunds, setRefunds] = useState<CustomerRefundWithOrder[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [rets, exchs, refs] = await Promise.all([
        fetchCustomerReturnRequests(),
        fetchCustomerExchangeRequests(),
        fetchCustomerRefunds(),
      ]);
      setReturns(rets);
      setExchanges(exchs);
      setRefunds(refs);
    } catch (err) {
      console.error('Error loading returns hub data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'border-emerald-900/30 text-emerald-900 bg-emerald-50';
      case 'rejected':
      case 'failed':
        return 'border-red-900/30 text-red-900 bg-red-50';
      default:
        return 'border-amber-900/30 text-amber-900 bg-amber-50';
    }
  };

  return (
    <AccountLayout activeKey="returns" title="Refunds & Returns Hub">
      <div className="space-y-4 sm:space-y-6">
        {/* PAGE HEADER */}
        <div className="bg-white border border-[#EAE8E2] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-[#736E65] block">
                CLIENT CONCIERGE CARE
              </span>
              <h1 className="font-editorial text-2xl sm:text-3xl font-light uppercase tracking-tight text-[#0A0A0A] mt-0.5">
                REFUNDS &amp; RETURNS HUB
              </h1>
            </div>
            <div className="inline-flex items-center space-x-1.5 text-xs text-[#736E65] bg-[#FAF9F6] border border-[#EAE8E2] px-3 py-1.5 shadow-xs">
              <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
              <span className="tracking-wider uppercase text-[11px] font-medium text-[#0A0A0A]">
                7-DAY PICKUP GUARANTEE
              </span>
            </div>
          </div>

          {/* TAB PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-[#EAE8E2]">
            {[
              { key: 'returns', label: `RETURNS (${returns.length})` },
              { key: 'exchanges', label: `EXCHANGES (${exchanges.length})` },
              { key: 'refunds', label: `REFUNDS (${refunds.length})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`shrink-0 px-3.5 sm:px-4 py-2 text-[11px] sm:text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer shadow-xs ${
                  activeTab === key
                    ? 'bg-[#0A0A0A] text-white'
                    : 'bg-white text-[#736E65] hover:text-[#0A0A0A] border border-[#EAE8E2]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* QUICK PROMPT FOR DELIVERED ORDERS */}
          <div className="bg-[#FAF9F6] p-3.5 border border-[#EAE8E2] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center space-x-2 text-[#383531]">
              <RotateCcw size={14} className="text-[#0A0A0A] shrink-0" />
              <span>Need to initiate a return or exchange for a delivered order?</span>
            </div>
            <Link
              to="/account/orders"
              className="inline-flex items-center space-x-1.5 font-semibold text-[#0A0A0A] hover:underline uppercase tracking-wider text-[11px] shrink-0"
            >
              <span>CHOOSE DELIVERED ORDER</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="py-16 sm:py-20 text-center text-xs tracking-widest uppercase text-[#736E65] bg-white border border-[#EAE8E2] shadow-xs">
            LOADING RECORDS...
          </div>
        ) : error ? (
          <div className="bg-white p-6 border border-[#EAE8E2] shadow-xs">
            <ErrorState
              title="RECORDS UNAVAILABLE"
              message="Failed to load returns data."
              onRetry={loadData}
            />
          </div>
        ) : (
          <div>
            {/* RETURNS TAB */}
            {activeTab === 'returns' && (
              <div className="space-y-3 sm:space-y-4">
                {returns.length === 0 ? (
                  <div className="bg-white py-10 sm:py-14 px-5 sm:px-6 border border-[#EAE8E2] shadow-xs text-center space-y-4">
                    <EmptyState
                      title="NO RETURN REQUESTS"
                      message="You have no active or previous item return requests."
                    />
                    <div className="pt-2">
                      <Link
                        to="/account/orders"
                        className="btn-editorial-outline py-2.5 px-5 text-xs tracking-[0.2em] inline-flex items-center space-x-2 cursor-pointer"
                      >
                        <span>SELECT A DELIVERED ORDER TO RETURN</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  returns.map((ret) => (
                    <div
                      key={ret.id}
                      className="bg-white p-4 sm:p-5 border border-[#EAE8E2] shadow-xs space-y-3 hover:border-[#0A0A0A] transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EAE8E2]">
                        <div className="flex items-center space-x-2 min-w-0">
                          <RotateCcw size={15} className="text-[#0A0A0A] shrink-0" />
                          <span className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-[#0A0A0A] truncate">
                            RETURN #{ret.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-widest uppercase border ${getStatusBadge(
                            ret.status
                          )}`}
                        >
                          {ret.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#736E65]">
                        <div>
                          <span className="text-[10px] tracking-widest uppercase text-[#0A0A0A] block mb-0.5 font-semibold">
                            ORDER REFERENCE
                          </span>
                          <span className="font-mono text-[#0A0A0A]">
                            {ret.orders ? formatOrderNumber(ret.orders.order_number) : ret.order_id}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] tracking-widest uppercase text-[#0A0A0A] block mb-0.5 font-semibold">
                            REASON
                          </span>
                          <span>{ret.reason}</span>
                        </div>
                      </div>
                      {ret.refund_amount && (
                        <div className="pt-2 sm:pt-3 border-t border-[#EAE8E2] flex items-center justify-between">
                          <span className="text-[10px] tracking-widest uppercase text-[#736E65] font-semibold">
                            ESTIMATED REFUND
                          </span>
                          <span className="font-editorial text-lg font-light text-[#0A0A0A]">
                            ₹{Number(ret.refund_amount).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* EXCHANGES TAB */}
            {activeTab === 'exchanges' && (
              <div className="space-y-3 sm:space-y-4">
                {exchanges.length === 0 ? (
                  <div className="bg-white py-10 sm:py-14 px-5 sm:px-6 border border-[#EAE8E2] shadow-xs text-center space-y-4">
                    <EmptyState
                      title="NO EXCHANGE REQUESTS"
                      message="You have no active or completed garment size exchange requests."
                    />
                    <div className="pt-2">
                      <Link
                        to="/account/orders"
                        className="btn-editorial-outline py-2.5 px-5 text-xs tracking-[0.2em] inline-flex items-center space-x-2 cursor-pointer"
                      >
                        <span>SELECT A DELIVERED ORDER TO EXCHANGE</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  exchanges.map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-white p-4 sm:p-5 border border-[#EAE8E2] shadow-xs space-y-3 hover:border-[#0A0A0A] transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EAE8E2]">
                        <div className="flex items-center space-x-2 min-w-0">
                          <RefreshCw size={15} className="text-[#0A0A0A] shrink-0" />
                          <span className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-[#0A0A0A] truncate">
                            EXCHANGE #{ex.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-widest uppercase border ${getStatusBadge(
                            ex.status
                          )}`}
                        >
                          {ex.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#736E65]">
                        <div>
                          <span className="text-[10px] tracking-widest uppercase text-[#0A0A0A] block mb-0.5 font-semibold">
                            ORDER REFERENCE
                          </span>
                          <span className="font-mono text-[#0A0A0A]">
                            {ex.orders ? formatOrderNumber(ex.orders.order_number) : ex.order_id}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] tracking-widest uppercase text-[#0A0A0A] block mb-0.5 font-semibold">
                            DESIRED REPLACEMENT SIZE
                          </span>
                          <span className="text-[#0A0A0A] font-medium">
                            {ex.requested_variant?.size || ex.reason}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* REFUNDS TAB */}
            {activeTab === 'refunds' && (
              <div className="space-y-3 sm:space-y-4">
                {refunds.length === 0 ? (
                  <div className="bg-white py-10 sm:py-14 px-5 sm:px-6 border border-[#EAE8E2] shadow-xs">
                    <EmptyState
                      title="NO REFUND TRANSACTIONS"
                      message="You have no processed or pending refund transactions."
                    />
                  </div>
                ) : (
                  refunds.map((ref) => (
                    <div
                      key={ref.id}
                      className="bg-white p-4 sm:p-5 border border-[#EAE8E2] shadow-xs space-y-3 hover:border-[#0A0A0A] transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EAE8E2]">
                        <div className="flex items-center space-x-2 min-w-0">
                          <DollarSign size={15} className="text-[#0A0A0A] shrink-0" />
                          <span className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-[#0A0A0A] truncate">
                            REFUND #{ref.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-widest uppercase border ${getStatusBadge(
                            ref.status
                          )}`}
                        >
                          {ref.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#736E65]">
                        <div>
                          <span className="text-[10px] tracking-widest uppercase text-[#0A0A0A] block mb-0.5 font-semibold">
                            REFUND REFERENCE
                          </span>
                          <span className="uppercase text-[#0A0A0A] font-mono">
                            {ref.provider_refund_id || 'ONLINE PAYMENT GATEWAY'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] tracking-widest uppercase text-[#0A0A0A] block mb-0.5 font-semibold">
                            AMOUNT
                          </span>
                          <span className="font-editorial text-lg font-light text-[#0A0A0A]">
                            ₹{Number(ref.amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AccountLayout>
  );
};
