export type ProductStatus = 'draft' | 'active' | 'archived';
export type VariantStatus = 'active' | 'inactive' | 'out_of_stock';
export type CartStatus = 'active' | 'converted' | 'abandoned';
export type UserRole = 'customer' | 'admin';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';
export type PaymentMethod = 'cod' | 'razorpay';
export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order_value: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  per_user_limit: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string | null;
  order_id: string;
  discount_amount: number;
  used_at: string;
  session_id: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category: string;
  fabric: string | null;
  care_instructions: string | null;
  status: ProductStatus;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
  is_top_deal?: boolean;
  created_at: string;
  updated_at: string;
  product_variants?: ProductVariant[];
  product_images?: ProductImage[];
}

export type BannerType = 'hero' | 'middle_banner' | 'promo_bar' | 'category_banner';

export interface StorefrontBanner {
  id: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  image_url: string;
  storage_path: string;
  mobile_image_url?: string | null;
  mobile_storage_path?: string | null;
  banner_type: BannerType;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  color_name: string;
  color_hex: string;
  size: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  low_stock_threshold: number;
  status: VariantStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface FormattedProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category: string;
  fabric: string | null;
  care_instructions: string | null;
  status: ProductStatus;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
  is_top_deal?: boolean;
  price: number;
  compareAtPrice: number | null;
  primaryImage: string;
  images: ProductImage[];
  colors: { color_name: string; color_hex: string }[];
  sizes: string[];
  variants: ProductVariant[];
}

export interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  status: CartStatus;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface FormattedCartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  product_name: string;
  product_slug: string;
  color_name: string;
  color_hex: string;
  size: string;
  unit_price: number;
  total_price: number;
  image_url: string;
  max_stock: number;
  status: VariantStatus;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  coupon_id: string | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_address_line_1: string;
  shipping_address_line_2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  product_name_snapshot: string;
  color_name_snapshot: string;
  size_snapshot: string;
  sku_snapshot: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  created_at: string;
  image_url?: string;
  product_slug?: string;
  product?: Product;
}

export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'pickup_scheduled'
  | 'received'
  | 'quality_check'
  | 'refund_pending'
  | 'refund_initiated'
  | 'completed';

export type ExchangeStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'pickup_scheduled'
  | 'received'
  | 'quality_check'
  | 'replacement_processing'
  | 'shipped'
  | 'completed';

export type RefundStatus =
  | 'pending'
  | 'processing'
  | 'initiated'
  | 'completed'
  | 'failed'
  | 'rejected';

export interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  description?: string | null;
  status: ReturnStatus;
  refund_amount?: number | null;
  admin_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRequest {
  id: string;
  order_id: string;
  user_id: string;
  original_variant_id: string;
  requested_variant_id: string;
  quantity: number;
  reason: string;
  description?: string | null;
  status: ExchangeStatus;
  admin_note?: string | null;
  created_at: string;
  updated_at: string;
  original_variant?: ProductVariant;
  requested_variant?: ProductVariant;
}

export interface Refund {
  id: string;
  order_id: string;
  return_request_id?: string | null;
  payment_id?: string | null;
  amount: number;
  provider_refund_id?: string | null;
  status: RefundStatus;
  reason?: string | null;
  failure_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  tagline: string | null;
  support_email: string;
  support_phone: string;
  currency: string;
  currency_symbol: string;
  gst_number: string | null;
  company_address: string | null;
  free_shipping_threshold: number;
  flat_shipping_rate: number;
  cod_enabled: boolean;
  cod_extra_charge: number;
  return_policy_days: number;
  exchange_policy_days: number;
  is_returns_enabled: boolean;
  is_exchanges_enabled: boolean;
  announcement_bar_enabled: boolean;
  announcement_bar_text: string | null;
  maintenance_mode: boolean;
  social_links: {
    twitter?: string;
    youtube?: string;
    facebook?: string;
    instagram?: string;
  };
  extra_config?: Record<string, unknown>;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

