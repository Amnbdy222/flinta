import React, { useState } from 'react';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 text-[#0A0A0A]">
      <div className="container-editorial max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4 pb-12 hairline-b">
          <span className="editorial-subtitle block">CLIENT SERVICES</span>
          <h1 className="font-editorial text-4xl md:text-6xl font-light uppercase tracking-tight">
            CONTACT MAISON
          </h1>
          <p className="text-xs text-[#736E65] font-light leading-relaxed">
            For personal styling inquiries, sizing assistance, or client care, our advisors are at your service.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-12 hairline-all p-8 space-y-4 bg-[#FAF9F6]">
            <span className="text-[0.65rem] tracking-[0.3em] uppercase text-[#736E65] block">
              MESSAGE DISPATCHED
            </span>
            <h2 className="font-editorial text-3xl font-light">THANK YOU</h2>
            <p className="text-xs text-[#736E65] font-light">
              Your inquiry has been logged. A client concierge will respond within 24 business hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                  FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elena Rostova"
                  className="w-full bg-transparent border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. elena@domain.com"
                  className="w-full bg-transparent border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                INQUIRY TOPIC
              </label>
              <select className="w-full bg-transparent border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]">
                <option value="general">GENERAL INQUIRY</option>
                <option value="sizing">SIZING & FIT</option>
                <option value="shipping">SHIPPING & DISPATCH</option>
                <option value="press">PRESS & EDITORIAL</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                MESSAGE *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Write your inquiry here..."
                className="w-full bg-transparent border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
              ></textarea>
            </div>

            <div>
              <button type="submit" className="btn-editorial-primary w-full py-4 text-xs">
                SEND INQUIRY
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
