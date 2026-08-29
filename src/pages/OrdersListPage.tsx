import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCustomerOrders, formatOrderNumber } from '../services/orderService';
import {
  fetchCustomerReturnRequests,
  fetchCustomerExchangeRequests,
  CustomerReturnWithOrder,
  CustomerExchangeWithOrder,
} from '../services/returnExchangeService';
import { Order } from '../types/database.types';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { ArrowRight, Package, RotateCcw, RefreshCw, Ban } from 'lucide-react';
import { AccountLayout } from '../components/AccountLayout';

export const OrdersListPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnsMap, setReturnsMap] = useState<Record<string, CustomerReturnWithOrder>>({});
  const [exchangesMap, setExchangesMap] = useState<Record<string, CustomerExchangeWithOrder>>({});

  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setError(false);
    try {
      const [ordersData, retData, exchData] = await Promise.all([
        fetchCustomerOrders(),
        fetchCustomerReturnRequests(),
        fetchCustomerExchangeRequests(),
      ]);

      setOrders(ordersData);

      const rMap: Record<string, CustomerReturnWithOrder> = {};
      retData.forEach((r) => {
        rMap[r.order_id] = r;
      });
      setReturnsMap(rMap);

      const eMap: Record<string, CustomerExchangeWithOrder> = {};
      exchData.forEach((e) => {
        eMap[e.order_id] = e;
      });
      setExchangesMap(eMap);
    } catch (err) {
      console.error('Error loading customer orders:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

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

  return (
    <AccountLayout activeKey="orders" title="My Orders Archive">
      <div className="space-y-6">
        {/* PAGE TITLE */}
        <div className="pb-6 hairline-b flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 hairline-all">
          <div>
            <span className="editorial-subtitle block">PURCHASE ARCHIVE</span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-light uppercase tracking-tight mt-0.5">
              MY ORDERS ({orders.length})
            </h1>
          </div>
          <Link
            to="/account/returns"
            className="btn-editorial-outline text-xs py-2.5 px-4 sm:px-5 inline-flex items-center space-x-2 self-start sm:self-auto shrink-0"
          >
            <RotateCcw size={13} />
            <span>RETURNS HUB</span>
          </Link>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="py-16 sm:py-20 text-center text-xs tracking-widest uppercase text-[#736E65] bg-white hairline-all">
            RETRIEVING ORDER ARCHIVE...
          </div>
        ) : error ? (
          <div className="bg-white p-6 hairline-all">
            <ErrorState title="ORDERS UNAVAILABLE" message="Failed to load orders." onRetry={loadOrders} />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white py-6 sm:py-10 px-4 hairline-all">
            <EmptyState
              type="orders"
              actionPath="/shop"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const itemCount = order.order_items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
              const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              const activeReturn = returnsMap[order.id];
              const activeExchange = exchangesMap[order.id];
              const isCancellable = ['pending', 'confirmed', 'processing'].includes(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-white hairline-all hover:border-[#0A0A0A] transition-colors overflow-hidden"
                >
                  {/* ORDER HEADER */}
                  <div className="p-4 sm:p-6 bg-[#FAF9F6] hairline-b flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      {order.order_items && order.order_items[0]?.image_url ? (
                        <img
                          src={order.order_items[0].image_url}
                          alt={order.order_items[0].product_name_snapshot}
                          className="w-12 h-14 object-cover border border-[#0A0A0A]/10 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-14 bg-[#E6E4DD]/40 border border-[#0A0A0A]/10 flex items-center justify-center shrink-0">
                          <Package size={20} className="text-[#736E65]" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2.5">
                          <span className="font-mono text-sm font-semibold tracking-wider text-[#0A0A0A]">
                            {formatOrderNumber(order.order_number)}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[0.6rem] font-semibold tracking-widest uppercase border ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[0.7rem] text-[#736E65] font-light tracking-wider mt-1">
                          {formattedDate} &bull; {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[0.65rem] tracking-widest uppercase text-[#736E65] block">
                        TOTAL
                      </span>
                      <span className="font-editorial text-lg font-light text-[#0A0A0A]">
                        ₹{Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* ACTIVE RETURN / EXCHANGE BADGES */}
                  {(activeReturn || activeExchange) && (
                    <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-900 text-xs flex items-center space-x-2">
                      <RotateCcw size={14} className="shrink-0" />
                      <span className="font-medium">
                        {activeReturn ? `Return Requested (${activeReturn.status})` : `Exchange Requested (${activeExchange?.status})`}
                      </span>
                    </div>
                  )}

                  {/* ACTIONS BAR */}
                  <div className="p-4 sm:px-6 sm:py-4 flex flex-wrap items-center justify-end gap-3 bg-white">
                    {isCancellable && (
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForCancel(order)}
                        className="px-3.5 py-2 border border-red-900/30 text-red-900 hover:bg-red-50 text-[0.65rem] font-semibold tracking-widest uppercase transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Ban size={13} />
                        <span>CANCEL</span>
                      </button>
                    )}

                    {order.status === 'delivered' && !activeReturn && !activeExchange && (
                      <Link
                        to="/account/returns"
                        className="px-3.5 py-2 border border-[#0A0A0A]/20 text-[#0A0A0A] hover:border-[#0A0A0A] text-[0.65rem] font-semibold tracking-widest uppercase transition-colors inline-flex items-center space-x-1.5"
                      >
                        <RefreshCw size={13} />
                        <span>RETURN / EXCHANGE</span>
                      </Link>
                    )}

                    <Link
                      to={`/account/orders/${order.id}`}
                      className="btn-editorial-outline py-2 px-4 text-[0.65rem] tracking-[0.2em] inline-flex items-center space-x-2"
                    >
                      <span>VIEW ORDER</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CANCEL MODAL */}
        {selectedOrderForCancel && (
          <CancelOrderModal
            order={selectedOrderForCancel}
            isOpen={Boolean(selectedOrderForCancel)}
            onClose={() => setSelectedOrderForCancel(null)}
            onSuccess={loadOrders}
          />
        )}
      </div>
    </AccountLayout>
  );
};
