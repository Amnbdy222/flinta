import { supabase } from '../lib/supabase';
import { Cart, FormattedCartItem, VariantStatus } from '../types/database.types';

const SESSION_STORAGE_KEY = 'flint_cart_session_id';
const GUEST_CART_ITEMS_KEY = 'flint_guest_cart_items_v2';

export interface LocalGuestCartItem {
  id: string;
  variant_id: string;
  quantity: number;
}

// Format raw errors into clean, user-friendly messages
export function formatUserFriendlyError(msg: string): string {
  if (!msg) return 'An unexpected error occurred. Please try again.';
  const lower = msg.toLowerCase();

  if (
    lower.includes('row-level security') ||
    lower.includes('rls') ||
    lower.includes('permission denied') ||
    lower.includes('jwt expired') ||
    lower.includes('not authenticated')
  ) {
    return 'Please sign in to your FLINT A account to save garments to your bag and proceed.';
  }
  if (lower.includes('violates foreign key constraint')) {
    return 'The requested garment variant is no longer available.';
  }
  if (lower.includes('duplicate key value violates unique constraint')) {
    return 'You have already submitted a request for this item.';
  }
  return msg;
}

// Generate or retrieve persistent guest session ID
export function getOrCreateCartSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

// Retrieve local guest cart items
export function getLocalGuestCartItems(): LocalGuestCartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save local guest cart items
export function saveLocalGuestCartItems(items: LocalGuestCartItem[]): void {
  try {
    localStorage.setItem(GUEST_CART_ITEMS_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving local guest cart items:', err);
  }
}

// Clear local guest cart items
export function clearLocalGuestCartItems(): void {
  try {
    localStorage.removeItem(GUEST_CART_ITEMS_KEY);
  } catch (err) {
    console.error('Error clearing local guest cart items:', err);
  }
}

// Validate standard 36-character UUID format
export function isValidUUID(str: string): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Fetch active cart record or create one in Supabase (with fallback guest support)
export async function getOrCreateActiveCart(): Promise<Cart> {
  let sessionId = getOrCreateCartSessionId();

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (userId) {
      // 1. Check for active cart matching user_id
      const { data: userCarts } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      let activeCart: Cart;

      if (userCarts && userCarts.length > 0) {
        activeCart = userCarts[0] as Cart;
      } else {
        // Check session cart
        const { data: sessionCarts } = await supabase
          .from('carts')
          .select('*')
          .eq('session_id', sessionId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (sessionCarts && sessionCarts.length > 0 && (!sessionCarts[0].user_id || sessionCarts[0].user_id === userId)) {
          activeCart = sessionCarts[0] as Cart;
          if (!activeCart.user_id) {
            await supabase.from('carts').update({ user_id: userId }).eq('id', activeCart.id);
            activeCart.user_id = userId;
          }
        } else {
          // If sessionId is already bound to another user or collision occurs, generate fresh sessionId
          sessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
          localStorage.setItem(SESSION_STORAGE_KEY, sessionId);

          // Create new user cart with fresh sessionId
          let { data: newCart, error: insertError } = await supabase
            .from('carts')
            .insert({
              user_id: userId,
              session_id: sessionId,
              status: 'active',
            })
            .select()
            .single();

          if (insertError && (insertError.code === '23505' || insertError.message.includes('unique constraint') || insertError.message.includes('idx_carts_unique_active_session'))) {
            console.warn('DB user cart collision on session_id, retrying with fresh session ID...');
            sessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
            localStorage.setItem(SESSION_STORAGE_KEY, sessionId);

            const retry = await supabase
              .from('carts')
              .insert({
                user_id: userId,
                session_id: sessionId,
                status: 'active',
              })
              .select()
              .single();

            newCart = retry.data;
            insertError = retry.error;
          }

          if (newCart) {
            activeCart = newCart as Cart;
          } else {
            // Check if active cart exists for this user
            const { data: retryUserCarts } = await supabase
              .from('carts')
              .select('*')
              .eq('user_id', userId)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1);

            if (retryUserCarts && retryUserCarts.length > 0) {
              activeCart = retryUserCarts[0] as Cart;
            } else {
              console.warn('Could not create DB user cart:', insertError?.message);
              throw new Error(insertError?.message || 'Failed to initialize active shopping bag.');
            }
          }
        }
      }

      // Merge any pending guest local cart items into user's DB cart
      const localGuestItems = getLocalGuestCartItems();
      if (localGuestItems.length > 0 && activeCart.id && !activeCart.id.startsWith('user_fallback_')) {
        for (const gItem of localGuestItems) {
          try {
            await addItemToCart(activeCart.id, gItem.variant_id, gItem.quantity);
          } catch (mergeErr) {
            console.warn('Error merging guest cart item:', mergeErr);
          }
        }
        clearLocalGuestCartItems();
      }

      return activeCart;
    }

    // GUEST USER FLOW
    const { data: guestCarts } = await supabase
      .from('carts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (guestCarts && guestCarts.length > 0) {
      return guestCarts[0] as Cart;
    }

    // Try creating active guest cart in DB
    const { data: newGuestCart, error: guestInsertError } = await supabase
      .from('carts')
      .insert({
        session_id: sessionId,
        status: 'active',
      })
      .select()
      .single();

    if (guestInsertError || !newGuestCart) {
      // Return local virtual guest cart
      return {
        id: 'guest_local_' + sessionId,
        user_id: null,
        session_id: sessionId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return newGuestCart as Cart;
  } catch (err) {
    console.warn('Fallback to local guest cart due to error:', err);
    return {
      id: 'guest_local_' + sessionId,
      user_id: null,
      session_id: sessionId,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

// Fetch items for cart joining variants, products, and images
export async function fetchCartItems(cartId: string): Promise<FormattedCartItem[]> {
  try {
    // If virtual local guest cart
    if (cartId.startsWith('guest_local_') || cartId.startsWith('user_fallback_')) {
      const localItems = getLocalGuestCartItems();
      if (localItems.length === 0) return [];

      const variantIds = localItems.map((i) => i.variant_id);
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
          color_name,
          color_hex,
          size,
          price,
          stock,
          status,
          products (
            name,
            slug,
            product_images ( public_url, is_primary )
          )
        `)
        .in('id', variantIds);

      if (!variantsData) return [];

      const formatted: FormattedCartItem[] = [];

      for (const localItm of localItems) {
        const vData = variantsData.find((v) => v.id === localItm.variant_id);
        if (!vData) continue;

        const prodObj = Array.isArray(vData.products) ? vData.products[0] : vData.products;
        const prod = (prodObj as unknown as Record<string, unknown>) || {};
        const images = (prod.product_images as Record<string, unknown>[]) || [];
        const primaryImg =
          (images.find((i) => i.is_primary)?.public_url as string) ||
          (images[0]?.public_url as string) ||
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop';

        const unitPrice = Number(vData.price) || 0;
        const qty = localItm.quantity;

        formatted.push({
          id: 'local_' + localItm.variant_id,
          cart_id: cartId,
          product_id: String(vData.product_id || ''),
          variant_id: localItm.variant_id,
          quantity: qty,
          product_name: String(prod.name || 'Garment'),
          product_slug: String(prod.slug || ''),
          color_name: String(vData.color_name || 'Standard'),
          color_hex: String(vData.color_hex || '#000000'),
          size: String(vData.size || 'M'),
          unit_price: unitPrice,
          total_price: unitPrice * qty,
          image_url: primaryImg,
          max_stock: Number(vData.stock) || 0,
          status: (vData.status as VariantStatus) || 'active',
        });
      }

      return formatted;
    }

    // Database cart items
    const { data: rawItems, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        product_id,
        variant_id,
        quantity,
        products (
          name,
          slug,
          product_images ( public_url, is_primary )
        ),
        product_variants (
          color_name,
          color_hex,
          size,
          price,
          stock,
          status
        )
      `)
      .eq('cart_id', cartId)
      .order('created_at', { ascending: true });

    if (error || !rawItems) {
      console.warn('Fallback to local guest items on DB cart_items error:', error?.message);
      return [];
    }

    return (rawItems as unknown as Record<string, unknown>[]).map((item) => {
      const prod = (item.products as Record<string, unknown>) || {};
      const variant = (item.product_variants as Record<string, unknown>) || {};
      const images = (prod.product_images as Record<string, unknown>[]) || [];
      const primaryImg =
        (images.find((i) => i.is_primary)?.public_url as string) ||
        (images[0]?.public_url as string) ||
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop';

      const unitPrice = Number(variant.price) || 0;
      const qty = Number(item.quantity) || 1;

      return {
        id: String(item.id || ''),
        cart_id: String(item.cart_id || ''),
        product_id: String(item.product_id || ''),
        variant_id: String(item.variant_id || ''),
        quantity: qty,
        product_name: String(prod.name || 'Garment'),
        product_slug: String(prod.slug || ''),
        color_name: String(variant.color_name || 'Standard'),
        color_hex: String(variant.color_hex || '#000000'),
        size: String(variant.size || 'M'),
        unit_price: unitPrice,
        total_price: unitPrice * qty,
        image_url: primaryImg,
        max_stock: Number(variant.stock) || 0,
        status: (variant.status as VariantStatus) || 'active',
      };
    });
  } catch (err) {
    console.error('Unexpected error in fetchCartItems:', err);
    return [];
  }
}

// Add item to cart enforcing stock limits & fallback local storage
export async function addItemToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1
): Promise<void> {
  // 1. Fetch variant to verify stock
  const { data: variant, error: varError } = await supabase
    .from('product_variants')
    .select('id, product_id, stock, status')
    .eq('id', variantId)
    .single();

  if (varError || !variant) {
    throw new Error('Requested product variant could not be found.');
  }

  if (variant.status !== 'active' || variant.stock <= 0) {
    throw new Error('This garment variant is currently out of stock.');
  }

  // Handle local guest cart
  if (cartId.startsWith('guest_local_') || cartId.startsWith('user_fallback_')) {
    const localItems = getLocalGuestCartItems();
    const existingIndex = localItems.findIndex((i) => i.variant_id === variantId);

    if (existingIndex >= 0) {
      const newQty = localItems[existingIndex].quantity + quantity;
      if (newQty > variant.stock) {
        throw new Error(`Cannot add more items. Maximum stock available is ${variant.stock}.`);
      }
      localItems[existingIndex].quantity = newQty;
    } else {
      if (quantity > variant.stock) {
        throw new Error(`Cannot add items. Maximum stock available is ${variant.stock}.`);
      }
      localItems.push({
        id: 'local_' + variantId,
        variant_id: variantId,
        quantity: quantity,
      });
    }

    saveLocalGuestCartItems(localItems);
    return;
  }

  // Handle Database cart_items insertion
  try {
    const { data: existingItems } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('variant_id', variantId)
      .limit(1);

    if (existingItems && existingItems.length > 0) {
      const existing = existingItems[0];
      const newQty = existing.quantity + quantity;

      if (newQty > variant.stock) {
        throw new Error(`Cannot add more items. Maximum stock available is ${variant.stock}.`);
      }

      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (updateError) {
        throw new Error(formatUserFriendlyError(updateError.message));
      }
    } else {
      if (quantity > variant.stock) {
        throw new Error(`Cannot add items. Maximum stock available is ${variant.stock}.`);
      }

      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: variant.product_id,
          variant_id: variantId,
          quantity: quantity,
        });

      if (insertError) {
        // Fallback to local guest storage if RLS blocks anonymous insert
        if (
          insertError.message.toLowerCase().includes('row-level security') ||
          insertError.message.toLowerCase().includes('permission denied')
        ) {
          const localItems = getLocalGuestCartItems();
          const existingIndex = localItems.findIndex((i) => i.variant_id === variantId);
          if (existingIndex >= 0) {
            localItems[existingIndex].quantity += quantity;
          } else {
            localItems.push({ id: 'local_' + variantId, variant_id: variantId, quantity });
          }
          saveLocalGuestCartItems(localItems);
          return;
        }

        throw new Error(formatUserFriendlyError(insertError.message));
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unable to add garment to bag.';
    throw new Error(formatUserFriendlyError(msg));
  }
}

// Update cart item quantity
export async function updateCartItemQuantity(
  itemId: string,
  newQuantity: number,
  maxStock: number
): Promise<void> {
  if (newQuantity <= 0) {
    return removeCartItem(itemId);
  }

  if (newQuantity > maxStock) {
    throw new Error(`Cannot set quantity above available stock (${maxStock}).`);
  }

  if (itemId.startsWith('local_')) {
    const variantId = itemId.replace('local_', '');
    const localItems = getLocalGuestCartItems();
    const idx = localItems.findIndex((i) => i.variant_id === variantId);
    if (idx >= 0) {
      localItems[idx].quantity = newQuantity;
      saveLocalGuestCartItems(localItems);
    }
    return;
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
    .eq('id', itemId);

  if (error) {
    throw new Error(formatUserFriendlyError(error.message));
  }
}

// Remove item from cart
export async function removeCartItem(itemId: string): Promise<void> {
  if (itemId.startsWith('local_')) {
    const variantId = itemId.replace('local_', '');
    const localItems = getLocalGuestCartItems();
    const updated = localItems.filter((i) => i.variant_id !== variantId);
    saveLocalGuestCartItems(updated);
    return;
  }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw new Error(formatUserFriendlyError(error.message));
  }
}
