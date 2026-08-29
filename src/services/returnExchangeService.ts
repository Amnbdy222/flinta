import { supabase } from '../lib/supabase';
import { ReturnRequest, ExchangeRequest, Refund, ProductVariant } from '../types/database.types';

export async function fetchReturnRequest(orderId: string): Promise<ReturnRequest | null> {
  const { data, error } = await supabase
    .from('return_requests')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching return request:', error);
    return null;
  }
  return data as ReturnRequest | null;
}

export async function fetchExchangeRequests(orderId: string): Promise<ExchangeRequest[]> {
  const { data, error } = await supabase
    .from('exchange_requests')
    .select(`
      *,
      original_variant:original_variant_id (*),
      requested_variant:requested_variant_id (*)
    `)
    .eq('order_id', orderId);

  if (error) {
    console.error('Error fetching exchange requests:', error);
    return [];
  }
  return (data || []) as ExchangeRequest[];
}

export async function fetchRefunds(orderId: string): Promise<Refund[]> {
  const { data, error } = await supabase
    .from('refunds')
    .select('*')
    .eq('order_id', orderId);

  if (error) {
    console.error('Error fetching refunds:', error);
    return [];
  }
  return (data || []) as Refund[];
}

export async function fetchAvailableVariantsForProduct(productId: string): Promise<ProductVariant[]> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching variants:', error);
    return [];
  }
  return (data || []) as ProductVariant[];
}

export async function createReturnRequest(params: {
  order_id: string;
  reason: string;
  description?: string;
  refund_amount?: number;
}): Promise<ReturnRequest> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('return_requests')
    .insert([
      {
        order_id: params.order_id,
        user_id: userId,
        reason: params.reason,
        description: params.description || null,
        status: 'requested',
        refund_amount: params.refund_amount || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating return request:', error);
    throw new Error(error.message || 'Failed to submit return request.');
  }

  return data as ReturnRequest;
}

export async function createExchangeRequest(params: {
  order_id: string;
  original_variant_id: string;
  requested_variant_id: string;
  quantity: number;
  reason: string;
  description?: string;
}): Promise<ExchangeRequest> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('exchange_requests')
    .insert([
      {
        order_id: params.order_id,
        user_id: userId,
        original_variant_id: params.original_variant_id,
        requested_variant_id: params.requested_variant_id,
        quantity: params.quantity,
        reason: params.reason,
        description: params.description || null,
        status: 'requested',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating exchange request:', error);
    throw new Error(error.message || 'Failed to submit exchange request.');
  }

  return data as ExchangeRequest;
}

export interface CustomerReturnWithOrder extends ReturnRequest {
  orders?: {
    order_number: string;
    total_amount: number;
    created_at: string;
  };
}

export interface CustomerExchangeWithOrder extends ExchangeRequest {
  orders?: {
    order_number: string;
    created_at: string;
  };
}

export interface CustomerRefundWithOrder extends Refund {
  orders?: {
    order_number: string;
    created_at: string;
  };
}

export async function fetchCustomerReturnRequests(): Promise<CustomerReturnWithOrder[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('return_requests')
    .select(`
      *,
      orders (
        order_number,
        total_amount,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customer return requests:', error);
    return [];
  }
  return (data || []) as CustomerReturnWithOrder[];
}

export async function fetchCustomerExchangeRequests(): Promise<CustomerExchangeWithOrder[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('exchange_requests')
    .select(`
      *,
      original_variant:original_variant_id (*),
      requested_variant:requested_variant_id (*),
      orders (
        order_number,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customer exchange requests:', error);
    return [];
  }
  return (data || []) as CustomerExchangeWithOrder[];
}

export async function fetchCustomerRefunds(): Promise<CustomerRefundWithOrder[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) return [];

  const { data: ordersData } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId);

  if (!ordersData || ordersData.length === 0) return [];
  const orderIds = ordersData.map((o) => o.id);

  const { data, error } = await supabase
    .from('refunds')
    .select(`
      *,
      orders (
        order_number,
        created_at
      )
    `)
    .in('order_id', orderIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customer refunds:', error);
    return [];
  }
  return (data || []) as CustomerRefundWithOrder[];
}
