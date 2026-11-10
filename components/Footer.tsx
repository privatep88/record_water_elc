import React, { useState } from 'react';
import { MapPin, Phone, Mail, ChevronLeft } from 'lucide-react';

const Footer: React.FC = () => {
  const [skylineError, setSkylineError] = useState(false);

  return (
    <footer className="bg-[#091526] text-blue-50 pt-7 pb-4 mt-auto border-t-[3px] border-[#eab308] relative overflow-hidden">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mb-5 print:hidden">
          {/* Column 1 (Right - RTL Start): عن SAHER */}
          <div className="md:col-span-4 space-y-3 text-right">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-wide border-b-2 border-[#eab308] pb-1.5 inline-block">
                عن SAHER
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/85 leading-relaxed max-w-md">
              شركة رائدة في تقديم الحلول والأنظمة الذكية، ملتزمون بالابتكار والجودة لتحقيق أعلى مستويات الكفاءة والخدمات الذكية.
            </p>
          </div>

          {/* Column 2 (Center-Right): روابط سريعة */}
          <div className="md:col-span-2 text-right">
            <h3 className="text-base sm:text-lg font-extrabold text-white mb-3 border-b-2 border-[#eab308] pb-1.5 inline-block">
              روابط سريعة
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              {['الرئيسية', 'خدماتنا', 'تواصل معنا'].map((item) => (
                <li key={item}>
                  <a
                    href="#top"
                    onClick={(e) => {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 text-blue-100 hover:text-sky-400 transition-colors group w-fit"
                  >
                    <ChevronLeft
                      size={15}
                      className="text-sky-400 group-hover:-translate-x-1 transition-transform"
                    />
                    <span>{item}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 (Center-Left): تواصل معنا */}
          <div className="md:col-span-3 text-right">
            <h3 className="text-base sm:text-lg font-extrabold text-white mb-3 border-b-2 border-[#eab308] pb-1.5 inline-block">
              تواصل معنا
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center gap-3 group">
                <div className="bg-sky-500/20 p-1.5 rounded-full border border-sky-400/40 text-sky-400 shrink-0">
                  <MapPin size={15} />
                </div>
                <span className="text-blue-100/90 font-sans" dir="ltr">
                  Level 3, Baynona Building, Khalif City A
                </span>
              </div>

              <div className="flex items-center gap-3 group">
                <div className="bg-sky-500/20 p-1.5 rounded-full border border-sky-400/40 text-sky-400 shrink-0">
                  <Phone size={15} />
                </div>
                <span className="text-blue-100/90 font-mono tabular-nums" dir="ltr">
                  +971 4 123 4567
                </span>
              </div>

              <div className="flex items-center gap-3 group">
                <div className="bg-sky-500/20 p-1.5 rounded-full border border-sky-400/40 text-sky-400 shrink-0">
                  <Mail size={15} />
                </div>
                <a
                  href="mailto:Logistic@saher.ae"
                  className="text-blue-100/90 hover:text-white transition-colors font-sans"
                  dir="ltr"
                >
                  Logistic@saher.ae
                </a>
              </div>
            </div>
          </div>

          {/* Column 4 (Far Left - RTL End): Architectural Skyline Vignette */}
          <div className="md:col-span-3 flex justify-end items-end self-stretch">
            <div className="w-full max-w-[270px] h-[135px] rounded-tr-[95px] rounded-tl-xl rounded-b-xl overflow-hidden border-t-[3px] border-r-[3px] border-[#eab308] shadow-lg relative bg-[#112240]">
              {!skylineError ? (
                <img
                  src="/src/assets/images/saher_footer_skyline_1794290957010.jpg"
                  alt="SAHER Corporate Skyline"
                  referrerPolicy="no-referrer"
                  onError={() => setSkylineError(true)}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#0a192f] via-[#1e3a8a] to-[#eab308]/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#091526]/50 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Bottom Bar - Centered Copyright & Credits */}
        <div className="border-t border-blue-900/60 pt-3 flex flex-col justify-center items-center gap-1 text-xs">
          <div className="flex items-center gap-1.5 text-blue-200/80 font-medium">
            <span>إعداد وتصميم /</span>
            <span className="font-bold text-white">خالد الجفري</span>
          </div>

          <div className="text-blue-300/70 text-center font-light">
            جميع الحقوق محفوظة لشركة &copy; {new Date().getFullYear()} SAHER FOR SMART SERVICES
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;