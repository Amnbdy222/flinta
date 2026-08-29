import React, { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'product';
  canonicalUrl?: string;
  productData?: {
    name: string;
    description?: string | null;
    image?: string;
    price: number;
    currency?: string;
    inStock: boolean;
    category?: string;
    ratingValue?: number;
    reviewCount?: number;
  };
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image,
  type = 'website',
  canonicalUrl,
  productData,
}) => {
  const siteName = 'FLINT A | High Fashion Maison';
  const defaultDescription =
    'FLINT A — High fashion editorial storefront. Minimalist organic textiles, precision tailoring, and timeless garment archives.';
  const defaultImage =
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop';

  const pageTitle = title ? `${title} — ${siteName}` : siteName;
  const pageDescription = description || productData?.description || defaultDescription;
  const pageImage = image || productData?.image || defaultImage;
  const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : 'https://flintstore.com');

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

    // 2. Standard Meta Tags
    updateMetaTag('description', pageDescription);
    updateMetaTag('robots', 'index, follow');
    updateCanonicalLink(currentUrl);

    // 3. OpenGraph Social Sharing Meta Tags
    updateMetaTag('og:site_name', 'FLINT Maison', true);
    updateMetaTag('og:title', pageTitle, true);
    updateMetaTag('og:description', pageDescription, true);
    updateMetaTag('og:image', pageImage, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', currentUrl, true);

    // 4. Twitter Card Meta Tags
    updateMetaTag('twitter:card', 'summary_large_image');
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
        name: 'FLINT Maison',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://flintstore.com',
        logo: pageImage,
        sameAs: ['https://instagram.com', 'https://pinterest.com'],
      },
    ];

    if (productData) {
      const productSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: productData.name,
        image: [pageImage],
        description: pageDescription,
        category: productData.category || 'Apparel',
        brand: {
          '@type': 'Brand',
          name: 'FLINT',
        },
        offers: {
          '@type': 'Offer',
          url: currentUrl,
          priceCurrency: productData.currency || 'INR',
          price: productData.price,
          availability: productData.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
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
      // Cleanup script on unmount
      const scriptToRemove = document.head.querySelector('script[id="json-ld-seo"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [pageTitle, pageDescription, pageImage, type, currentUrl, productData]);

  return null;
};
