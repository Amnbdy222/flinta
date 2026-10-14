import React, { useEffect } from 'react';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'product';
  canonicalUrl?: string;
  noindex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  productData?: {
    name: string;
    description?: string | null;
    image?: string;
    price: number;
    currency?: string;
    inStock: boolean;
    category?: string;
    sku?: string;
    ratingValue?: number;
    reviewCount?: number;
  };
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  type = 'website',
  canonicalUrl,
  noindex = false,
  breadcrumbs,
  productData,
}) => {
  const siteName = 'FLINT A | Luxury Streetwear & High Fashion India';
  const defaultDescription =
    'FLINT A — Contemporary Indian luxury streetwear and minimalist garment archives. Heavyweight oversized tees, structured linen shirts, and tailored silhouettes. Free delivery in India.';
  const defaultImage = 'https://flintaindia.com/image.png';
  const defaultBaseUrl = 'https://flintaindia.com';

  const pageTitle = title ? (title.includes('FLINT') ? title : `${title} — FLINT A`) : siteName;
  const pageDescription = description || productData?.description || defaultDescription;
  const pageImage = image || productData?.image || defaultImage;

  // Generate clean canonical URL (strip tracking params like utm_*, fbclid, etc.)
  const getCleanCanonical = () => {
    if (canonicalUrl) return canonicalUrl;
    if (typeof window === 'undefined') return defaultBaseUrl;
    return `${defaultBaseUrl}${window.location.pathname}`;
  };

  const currentUrl = getCleanCanonical();

  useEffect(() => {
    // 1. Update Document Title
    document.title = pageTitle;

    // Helper function to update or create meta tags
    const updateMetaTag = (nameOrProperty: string, value: string, isProperty = false) => {
      const selector = isProperty
        ? `meta[property="${nameOrProperty}"]`
        : `meta[name="${nameOrProperty}"]`;
      let element = document.head.querySelector(selector) as HTMLMetaElement | null;

      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
          element.setAttribute('property', nameOrProperty);
        } else {
          element.setAttribute('name', nameOrProperty);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    // Helper to update canonical link
    const updateCanonicalLink = (url: string) => {
      let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    };

    // 2. Standard Meta Tags & Indexing Directives
    updateMetaTag('description', pageDescription);
    updateMetaTag(
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    updateMetaTag(
      'keywords',
      keywords ||
        'flint a, luxury fashion india, streetwear india, designer menswear, minimalist apparel, oversized t-shirts, tailored trousers, high fashion editorial'
    );
    updateCanonicalLink(currentUrl);

    // 3. OpenGraph Social Sharing Meta Tags
    updateMetaTag('og:site_name', 'FLINT A', true);
    updateMetaTag('og:title', pageTitle, true);
    updateMetaTag('og:description', pageDescription, true);
    updateMetaTag('og:image', pageImage, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:locale', 'en_IN', true);

    // E-Commerce specific OpenGraph Product tags
    if (productData) {
      updateMetaTag('product:price:amount', String(productData.price), true);
      updateMetaTag('product:price:currency', productData.currency || 'INR', true);
      updateMetaTag(
        'product:availability',
        productData.inStock ? 'in stock' : 'out of stock',
        true
      );
    }

    // 4. Twitter Card Meta Tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:site', '@flint_a_india');
    updateMetaTag('twitter:title', pageTitle);
    updateMetaTag('twitter:description', pageDescription);
    updateMetaTag('twitter:image', pageImage);

    // 5. JSON-LD Rich Snippet Structured Data
    const existingScript = document.head.querySelector('script[id="json-ld-seo"]');
    if (existingScript) {
      existingScript.remove();
    }

    const jsonLdData: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${defaultBaseUrl}/#organization`,
        name: 'FLINT A',
        url: defaultBaseUrl,
        logo: `${defaultBaseUrl}/image.png`,
        sameAs: ['https://www.instagram.com/flint_a_india'],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${defaultBaseUrl}/#website`,
        name: 'FLINT A',
        url: defaultBaseUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${defaultBaseUrl}/shop?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ];

    // BreadcrumbList Structured Data
    if (breadcrumbs && breadcrumbs.length > 0) {
      jsonLdData.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: crumb.name,
          item: crumb.url.startsWith('http') ? crumb.url : `${defaultBaseUrl}${crumb.url}`,
        })),
      });
    }

    // Product Schema.org Microdata (Google Merchant / Rich Results Complete)
    if (productData) {
      const generatedSku =
        productData.sku ||
        `FLINT-${productData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      const productSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: productData.name,
        image: [pageImage],
        description: pageDescription,
        category: productData.category || 'Apparel',
        sku: generatedSku,
        mpn: generatedSku,
        brand: {
          '@type': 'Brand',
          name: 'FLINT A',
        },
        offers: {
          '@type': 'Offer',
          url: currentUrl,
          priceCurrency: productData.currency || 'INR',
          price: productData.price,
          priceValidUntil: '2027-12-31',
          availability: productData.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: 'FLINT A',
          },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'IN',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 7,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/FreeReturn',
          },
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingRate: {
              '@type': 'MonetaryAmount',
              value: 0,
              currency: 'INR',
            },
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: 'IN',
            },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: {
                '@type': 'QuantitativeValue',
                minValue: 0,
                maxValue: 1,
                unitCode: 'd',
              },
              transitTime: {
                '@type': 'QuantitativeValue',
                minValue: 2,
                maxValue: 5,
                unitCode: 'd',
              },
            },
          },
        },
      };

      if (productData.ratingValue && productData.ratingValue > 0 && productData.reviewCount) {
        productSchema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: productData.ratingValue,
          reviewCount: productData.reviewCount,
        };
      }

      jsonLdData.push(productSchema);
    }

    const script = document.createElement('script');
    script.id = 'json-ld-seo';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLdData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.head.querySelector('script[id="json-ld-seo"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [
    pageTitle,
    pageDescription,
    keywords,
    pageImage,
    type,
    currentUrl,
    noindex,
    productData,
    breadcrumbs,
  ]);

  return null;
};

