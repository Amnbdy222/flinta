import { supabase } from '../lib/supabase';
import { Product, FormattedProduct, ProductImage, ProductVariant } from '../types/database.types';

// High-fashion editorial default images for fallback presentation
const EDITORIAL_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=1200&auto=format&fit=crop"
];

export function formatProduct(raw: Product, index: number = 0): FormattedProduct {
  const variants = raw.product_variants || [];
  const images = raw.product_images || [];

  // Determine primary image
  const primaryObj = images.find((img: ProductImage) => img.is_primary);
  let primaryImage = primaryObj?.public_url || (images.length > 0 ? images[0].public_url : '');
  
  if (!primaryImage) {
    primaryImage = EDITORIAL_FALLBACK_IMAGES[index % EDITORIAL_FALLBACK_IMAGES.length];
  }

  // Calculate starting price & compare price
  let price = 0;
  let compareAtPrice: number | null = null;

  if (variants.length > 0) {
    const validPrices = variants.map((v) => Number(v.price) || 0).filter((p) => p > 0);
    price = validPrices.length > 0 ? Math.min(...validPrices) : 0;

    const firstWithCompare = variants.find((v) => v.compare_at_price);
    if (firstWithCompare && firstWithCompare.compare_at_price) {
      compareAtPrice = Number(firstWithCompare.compare_at_price);
    }
  }

  // Extract unique colors
  const colorMap = new Map<string, string>();
  variants.forEach((v) => {
    if (v.color_name && v.color_hex) {
      colorMap.set(v.color_name, v.color_hex);
    }
  });

  const colors = Array.from(colorMap.entries()).map(([color_name, color_hex]) => ({
    color_name,
    color_hex,
  }));

  // Extract unique sizes
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    short_description: raw.short_description,
    category: raw.category,
    fabric: raw.fabric,
    care_instructions: raw.care_instructions,
    status: raw.status,
    is_new_arrival: Boolean(raw.is_new_arrival),
    is_best_seller: Boolean(raw.is_best_seller),
    is_top_deal: Boolean(raw.is_top_deal),
    price,
    compareAtPrice,
    primaryImage,
    images: images.length > 0 ? images : [{
      id: 'fallback-1',
      product_id: raw.id,
      variant_id: null,
      storage_path: '',
      public_url: primaryImage,
      alt_text: raw.name,
      sort_order: 0,
      is_primary: true,
      created_at: new Date().toISOString()
    }],
    colors: colors.length > 0 ? colors : [
      { color_name: 'Noir', color_hex: '#0A0A0A' },
      { color_name: 'Ecru', color_hex: '#F0EFEA' }
    ],
    sizes: sizes.length > 0 ? sizes : ['XS', 'S', 'M', 'L', 'XL'],
    variants,
  };
}

/**
 * Expands products with multiple color variants into individual single-variant product cards.
 * Each card represents one specific color variant with its own primary image,
 * specific price/compare price, and explicit color name on the UI label.
 */
export function expandProductsByColor(products: FormattedProduct[]): FormattedProduct[] {
  const result: FormattedProduct[] = [];

  for (const product of products) {
    if (!product.colors || product.colors.length <= 1) {
      result.push(product);
      continue;
    }

    product.colors.forEach((col, colIdx) => {
      // Find variants matching this specific color
      const matchingVariants = product.variants.filter(
        (v) => v.color_name?.toLowerCase() === col.color_name.toLowerCase()
      );
      const variantIds = new Set(matchingVariants.map((v) => v.id));

      // Find images linked to these variants
      const matchingImages = product.images.filter(
        (img) => img.variant_id && variantIds.has(img.variant_id)
      );

      // Dedicated primary image for this color variant
      const primaryForColor =
        matchingImages.find((img) => img.is_primary)?.public_url ||
        matchingImages[0]?.public_url ||
        product.images[colIdx]?.public_url ||
        product.primaryImage;

      // Put this variant's images first
      const orderedImages = matchingImages.length > 0
        ? [...matchingImages, ...product.images.filter((img) => !matchingImages.includes(img))]
        : product.images;

      // Price and compare price for this color variant
      const validPrices = matchingVariants.map((v) => Number(v.price) || 0).filter((p) => p > 0);
      const variantPrice = validPrices.length > 0 ? Math.min(...validPrices) : product.price;

      const firstWithCompare = matchingVariants.find((v) => v.compare_at_price);
      const variantComparePrice = firstWithCompare?.compare_at_price
        ? Number(firstWithCompare.compare_at_price)
        : product.compareAtPrice;

      // Reorder colors so this variant's color is first (selected by default on this card)
      const reorderedColors = [
        col,
        ...product.colors.filter((c) => c.color_name.toLowerCase() !== col.color_name.toLowerCase()),
      ];

      result.push({
        ...product,
        id: `${product.id}-${col.color_name.toLowerCase()}`,
        parentProductId: product.id,
        name: `${product.name} - ${col.color_name}`,
        selectedColorName: col.color_name,
        price: variantPrice,
        compareAtPrice: variantComparePrice,
        primaryImage: primaryForColor,
        images: orderedImages,
        colors: reorderedColors,
        variants: matchingVariants.length > 0 ? matchingVariants : product.variants,
      });
    });
  }

  return result;
}

export interface FetchProductsOptions {
  page?: number;
  limit?: number;
  category?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isTopDeal?: boolean;
  sort?: string;
  search?: string;
}

export interface PaginatedResult {
  products: FormattedProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchPaginatedProducts(
  options: FetchProductsOptions = {}
): Promise<PaginatedResult> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 12;

  try {
    let query = supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)', { count: 'exact' })
      .eq('status', 'active');

    if (options.category && options.category.trim() !== '') {
      query = query.ilike('category', `%${options.category.trim()}%`);
    }

    if (options.search && options.search.trim() !== '') {
      const term = `%${options.search.trim()}%`;
      query = query.or(`name.ilike.${term},description.ilike.${term},fabric.ilike.${term},category.ilike.${term}`);
    }

    if (options.isNewArrival) {
      query = query.eq('is_new_arrival', true);
    }
    if (options.isBestSeller) {
      query = query.eq('is_best_seller', true);
    }
    if (options.isTopDeal) {
      query = query.eq('is_top_deal', true);
    }

    if (options.sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (options.sort === 'name') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, count, error } = await query;

    if (error || !data) {
      console.error('Error in fetchPaginatedProducts query:', error);
      return { products: [], total: 0, page, limit, totalPages: 0 };
    }

    let formatted = data.map((item, idx) => formatProduct(item as Product, idx));

    if (options.color) {
      const colorsArr = Array.isArray(options.color)
        ? options.color.map((c) => c.toLowerCase())
        : typeof options.color === 'string'
        ? options.color.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean)
        : [];

      if (colorsArr.length > 0) {
        formatted = formatted.filter((p) =>
          p.colors.some((c) => colorsArr.includes(c.color_name.toLowerCase()))
        );
      }
    }

    if (options.size) {
      const sizesArr = Array.isArray(options.size)
        ? options.size.map((s) => s.toUpperCase())
        : typeof options.size === 'string'
        ? options.size.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
        : [];

      if (sizesArr.length > 0) {
        formatted = formatted.filter((p) =>
          p.sizes.some((s) => sizesArr.includes(s.toUpperCase()))
        );
      }
    }

    if (options.minPrice !== undefined && !isNaN(options.minPrice)) {
      formatted = formatted.filter((p) => p.price >= (options.minPrice as number));
    }

    if (options.maxPrice !== undefined && !isNaN(options.maxPrice)) {
      formatted = formatted.filter((p) => p.price <= (options.maxPrice as number));
    }

    if (options.inStockOnly) {
      formatted = formatted.filter((p) =>
        p.variants.some((v) => v.stock > 0 && v.status === 'active')
      );
    }

    let expanded = expandProductsByColor(formatted);

    if (options.color) {
      const colorsArr = Array.isArray(options.color)
        ? options.color.map((c) => c.toLowerCase())
        : typeof options.color === 'string'
        ? options.color.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean)
        : [];

      if (colorsArr.length > 0) {
        expanded = expanded.filter(
          (p) => p.selectedColorName && colorsArr.includes(p.selectedColorName.toLowerCase())
        );
      }
    }

    if (options.sort === 'price_asc') {
      expanded.sort((a, b) => a.price - b.price);
    } else if (options.sort === 'price_desc') {
      expanded.sort((a, b) => b.price - a.price);
    }

    const totalFiltered = expanded.length;
    const totalPages = Math.ceil(totalFiltered / limit);
    const startIndex = (page - 1) * limit;
    const paginatedProducts = expanded.slice(startIndex, startIndex + limit);

    return {
      products: paginatedProducts,
      total: totalFiltered || count || 0,
      page,
      limit,
      totalPages: totalPages > 0 ? totalPages : 1,
    };
  } catch (err) {
    console.error('Unexpected error in fetchPaginatedProducts:', err);
    return { products: [], total: 0, page, limit, totalPages: 0 };
  }
}

export async function fetchActiveProducts(): Promise<FormattedProduct[]> {
  const result = await fetchPaginatedProducts({ limit: 100 });
  return result.products;
}

export async function fetchProductBySlug(slug: string): Promise<FormattedProduct | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('slug', slug)
      .eq('status', 'active') // Strictly fetch ACTIVE products only for public security
      .single();

    if (error || !data) {
      console.error('Error fetching active product by slug:', error);
      return null;
    }

    return formatProduct(data as Product, 0);
  } catch (err) {
    console.error('Unexpected error fetching active product by slug:', err);
    return null;
  }
}

export interface DynamicFilterOptions {
  colors: { color_name: string; color_hex: string }[];
  sizes: string[];
  minPrice: number;
  maxPrice: number;
}

export async function fetchFilterOptions(): Promise<DynamicFilterOptions> {
  try {
    const { data } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('status', 'active');

    if (!data || data.length === 0) {
      return {
        colors: [
          { color_name: 'Black', color_hex: '#000000' },
          { color_name: 'White', color_hex: '#FFFFFF' },
          { color_name: 'Beige', color_hex: '#E6DFD5' },
        ],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        minPrice: 0,
        maxPrice: 1000,
      };
    }

    const colorMap = new Map<string, string>();
    const sizeSet = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;

    data.forEach((p) => {
      const variants = p.product_variants || [];
      variants.forEach((v: ProductVariant) => {
        if (v.color_name && v.color_hex) {
          colorMap.set(v.color_name, v.color_hex);
        }
        if (v.size) {
          sizeSet.add(v.size.toUpperCase());
        }
        const price = Number(v.price);
        if (price > 0) {
          if (price < minPrice) minPrice = price;
          if (price > maxPrice) maxPrice = price;
        }
      });
    });

    const colors = Array.from(colorMap.entries()).map(([color_name, color_hex]) => ({
      color_name,
      color_hex,
    }));

    return {
      colors: colors.length > 0 ? colors : [{ color_name: 'Black', color_hex: '#000000' }],
      sizes: Array.from(sizeSet).sort(),
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice: maxPrice === 0 ? 500 : maxPrice,
    };
  } catch (err) {
    console.error('Error fetching filter options:', err);
    return {
      colors: [{ color_name: 'Black', color_hex: '#000000' }],
      sizes: ['S', 'M', 'L'],
      minPrice: 0,
      maxPrice: 500,
    };
  }
}
