import React, { useState } from 'react';
import { Droplet, Zap } from 'lucide-react';
import heroBannerAsset from '../src/assets/images/saher_hero_banner_1794290957278.jpg';

const PUBLIC_HERO_FALLBACK = `${import.meta.env.BASE_URL}images/saher-header.jpg`;

export const HeroBanner: React.FC = () => {
  const [imgSrc, setImgSrc] = useState<string>(heroBannerAsset);
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => {
    if (imgSrc !== PUBLIC_HERO_FALLBACK) {
      setImgSrc(PUBLIC_HERO_FALLBACK);
    } else {
      setImgError(true);
    }
  };

  return (
    <section
      className="relative w-full h-[210px] sm:h-[245px] md:h-[265px] bg-[#091526] border-b-[3px] border-[#eab308] overflow-hidden select-none print:hidden"
      style={
        !imgError
          ? {
              backgroundImage: `url(${imgSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : undefined
      }
    >
      {/* Background Image with Bundled + Public Fallback */}
      {!imgError ? (
        <img
          src={imgSrc}
          alt="SAHER Smart Utilities Management Banner"
          onError={handleImageError}
          className="w-full h-full object-cover object-center"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-[#0a192f] via-[#112240] to-[#0a192f]" />
      )}

      {/* Atmospheric Contrast Scrim for Text Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06101e]/90 via-[#091526]/45 to-transparent" />
      <div className="absolute inset-0 bg-radial from-transparent via-[#091526]/20 to-[#091526]/50" />

      {/* Foreground Content Container */}
      <div className="absolute inset-0 max-w-[1600px] mx-auto px-4 sm:px-8 flex flex-col justify-end items-center pb-4 sm:pb-5 z-10">
        <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 w-full max-w-4xl">
          {/* Right Glowing Badge (Electricity - RTL Start) */}
          <div className="hidden sm:flex w-12 h-12 md:w-14 md:h-14 rounded-full bg-amber-500/20 border-2 border-amber-300/80 shadow-[0_0_24px_rgba(245,158,11,0.75)] backdrop-blur-md items-center justify-center shrink-0">
            <Zap className="w-6 h-6 md:w-7 md:h-7 text-amber-300 fill-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          </div>

          {/* Center Text Block */}
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl sm:text-3xl md:text-[34px] font-black text-white tracking-wide leading-tight drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]">
              إدارة استهلاك المياه والكهرباء
            </h2>
            <p className="text-xs sm:text-base md:text-[17px] font-bold text-blue-50/95 mt-1 sm:mt-1.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] max-w-2xl">
              منصة ذكية لتسجيل وتحليل ومتابعة استهلاك الموارد في مقرات ساهر
            </p>
          </div>

          {/* Left Glowing Badge (Water - RTL End) */}
          <div className="hidden sm:flex w-12 h-12 md:w-14 md:h-14 rounded-full bg-sky-500/25 border-2 border-sky-300/85 shadow-[0_0_24px_rgba(56,189,248,0.8)] backdrop-blur-md items-center justify-center shrink-0">
            <Droplet className="w-6 h-6 md:w-7 md:h-7 text-sky-300 fill-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
          </div>
        </div>

        {/* Gold Trapezoid Ribbon */}
        <div className="mt-2.5 sm:mt-3 relative">
          <div
            className="bg-gradient-to-r from-[#c88a1b] via-[#f5c451] to-[#c88a1b] text-[#091526] font-black text-[11px] sm:text-xs md:text-sm tracking-[0.14em] uppercase px-7 sm:px-10 py-1 sm:py-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.5)] border-y border-yellow-200/80"
            style={{
              clipPath: 'polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)',
            }}
          >
            SAHER SMART UTILITIES MANAGEMENT
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
