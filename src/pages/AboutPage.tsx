import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 text-[#0A0A0A]">
      <div className="container-editorial max-w-4xl mx-auto space-y-16">
        {/* HEADER */}
        <div className="text-center space-y-4 pb-12 hairline-b">
          <span className="editorial-subtitle block">OUR MAISON</span>
          <h1 className="font-editorial text-5xl md:text-7xl font-light uppercase tracking-tight">
            ABOUT FLINT
          </h1>
        </div>

        {/* HERO IMAGE */}
        <div className="aspect-[16/9] bg-[#F0EFEA] overflow-hidden hairline-all">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop"
            alt="FLINT Studio Atelier"
            className="w-full h-full object-cover grayscale contrast-105"
          />
        </div>

        {/* CONTENT SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pt-4">
          <div className="md:col-span-4">
            <span className="text-[0.65rem] font-medium tracking-[0.3em] uppercase text-[#736E65] block">
              FOUNDATIONAL PHILOSOPHY
            </span>
            <h2 className="font-editorial text-3xl font-light pt-2">
              PURITY IN FORM & TEXTURE
            </h2>
          </div>

          <div className="md:col-span-8 space-y-6 text-xs text-[#383531] font-light leading-relaxed">
            <p>
              FLINT was established with a singular objective: to strip away superfluous ornamentation and focus on the raw essence of garment construction. We view clothing not merely as apparel, but as wearable architectural objects.
            </p>
            <p>
              Every garment in our archive is crafted from ethically sourced, high-grade natural textiles. From long-staple organic cotton to unbleached linens and virgin wools, we select fabrics that age with grace and retain structural longevity.
            </p>
          </div>
        </div>

        {/* VALUES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 hairline-t">
          <div className="space-y-3">
            <span className="text-[0.65rem] tracking-[0.25em] text-[#736E65] uppercase block font-medium">
              01 / CRAFTSMANSHIP
            </span>
            <h3 className="font-editorial text-2xl font-light">HAND-FINISHED SEAMS</h3>
            <p className="text-xs text-[#736E65] font-light leading-relaxed">
              Meticulous tailoring protocols ensure clean interior finishing and maximum structural permanence.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[0.65rem] tracking-[0.25em] text-[#736E65] uppercase block font-medium">
              02 / MATERIALITY
            </span>
            <h3 className="font-editorial text-2xl font-light">RESPONSIBLE SOURCES</h3>
            <p className="text-xs text-[#736E65] font-light leading-relaxed">
              Partnering exclusively with certified mills committed to zero-waste production and water preservation.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[0.65rem] tracking-[0.25em] text-[#736E65] uppercase block font-medium">
              03 / MONOCHROME
            </span>
            <h3 className="font-editorial text-2xl font-light">RESTRAINED PALETTE</h3>
            <p className="text-xs text-[#736E65] font-light leading-relaxed">
              Obsidian, paper white, ecru, and slate shades designed for effortless cross-collection harmonization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
