import React from 'react';
import { Sparkles, ShieldCheck, Layers, Award } from 'lucide-react';

export const BrandStatement: React.FC = () => {
  const ethosPillars = [
    {
      icon: <Sparkles className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform duration-500" />,
      title: 'SUSTAINABLE MATERIALS',
      subtitle: 'Organic & Traceable',
      description: 'Ethically harvested organic cottons, Japanese denim, and Italian silk crafted with zero toxic dyes.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform duration-500" />,
      title: 'ETHICAL PRODUCTION',
      subtitle: 'Atelier Craftsmanship',
      description: 'Small-batch production in certified master ateliers with fair living wages and transparent supply chains.',
    },
    {
      icon: <Layers className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform duration-500" />,
      title: 'ARCHIVAL QUALITY',
      subtitle: 'Timeless Integrity',
      description: 'Reinforced seam construction and structural silhouette purity built to endure beyond seasonal trends.',
    },
  ];

  return (
    <section
      className="relative py-14 sm:py-20 md:py-28 lg:py-36 bg-[#0A0A0A] text-[#FAF9F6] overflow-hidden hairline-b"
      aria-label="Brand Philosophy"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.06)_0%,_rgba(10,10,10,0.98)_70%)]" />

      {/* Background watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] overflow-hidden">
        <span className="font-editorial text-[22vw] uppercase tracking-[0.2em] text-white font-light whitespace-nowrap">
          FLINT
        </span>
      </div>

      <div className="relative container-editorial max-w-5xl mx-auto space-y-10 sm:space-y-14 md:space-y-20">

        {/* HEADER QUOTE */}
        <div className="text-center max-w-4xl mx-auto space-y-5 sm:space-y-6 md:space-y-8">
          {/* Tag */}
          <div className="inline-flex items-center space-x-2 text-[0.65rem] font-medium tracking-[0.35em] text-[#C5A059] uppercase px-4 py-1.5 bg-white/[0.03] border border-[#C5A059]/20 backdrop-blur-sm">
            <Award size={13} className="text-[#C5A059]" />
            <span>THE FLINT ETHOS</span>
          </div>

          {/* Quote — compressed on mobile */}
          <h2 className="font-editorial text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light leading-[1.2] tracking-tight text-[#FAF9F6] px-2 sm:px-4">
            "WE BELIEVE IN GARMENTS CREATED WITH INTENTION, STRUCTURAL PURITY, AND TIMELESS INTEGRITY."
          </h2>

          {/* Gold divider */}
          <div className="flex items-center justify-center space-x-4 pt-1">
            <div className="w-10 sm:w-20 h-px bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent" />
            <span className="text-[#C5A059] text-xs font-serif">✦</span>
            <div className="w-10 sm:w-20 h-px bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent" />
          </div>

          {/* Subtext — hidden on mobile */}
          <p className="hidden sm:block text-xs sm:text-sm text-[#A39E93] font-light max-w-xl mx-auto leading-relaxed tracking-wider">
            Every piece is designed to exist beyond seasonal trends. Crafted with organic materials, refined monochrome palettes, and meticulous attention to detail.
          </p>
        </div>

        {/* ETHOS CARDS */}
        <div className="pt-2">

          {/* Mobile: horizontal snap scroll slider */}
          <div className="flex md:hidden gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 no-scrollbar">
            {ethosPillars.map((pillar, idx) => (
              <div
                key={idx}
                className="group relative bg-white/[0.02] border border-white/10 p-5 flex flex-col space-y-3 snap-start flex-shrink-0 w-[78vw] max-w-[280px]"
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#C5A059] to-transparent opacity-60" />
                <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  {pillar.icon}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[0.6rem] tracking-[0.25em] text-[#C5A059] uppercase block font-medium">
                    {pillar.subtitle}
                  </span>
                  <h3 className="font-editorial text-lg text-[#FAF9F6] font-normal tracking-wide">
                    {pillar.title}
                  </h3>
                </div>
                <p className="text-[0.7rem] text-[#A39E93] font-light leading-relaxed tracking-wide">
                  {pillar.description}
                </p>
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[0.6rem] tracking-widest text-[#736E65] uppercase mt-auto">
                  <span>PILLAR 0{idx + 1}</span>
                  <span>EXPLORE →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: standard 3-column grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 sm:gap-8">
            {ethosPillars.map((pillar, idx) => (
              <div
                key={idx}
                className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-[#C5A059]/40 p-6 sm:p-8 transition-all duration-500 backdrop-blur-sm flex flex-col justify-between space-y-4 hover:-translate-y-1 shadow-2xl"
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#C5A059] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:border-[#C5A059]/50 transition-colors duration-500">
                    {pillar.icon}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[0.6rem] tracking-[0.25em] text-[#C5A059] uppercase block font-medium">
                      {pillar.subtitle}
                    </span>
                    <h3 className="font-editorial text-xl text-[#FAF9F6] font-normal tracking-wide">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#A39E93] font-light leading-relaxed tracking-wide">
                    {pillar.description}
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[0.65rem] tracking-widest text-[#736E65] uppercase">
                  <span>PILLAR 0{idx + 1}</span>
                  <span className="group-hover:text-[#C5A059] transition-colors duration-300">EXPLORE →</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
