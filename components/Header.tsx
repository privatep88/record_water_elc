import React from 'react';
import { Calendar, Settings } from 'lucide-react';

interface HeaderProps {
  currentYear: number;
  onYearChange: (year: number) => void;
}

const Header: React.FC<HeaderProps> = ({ currentYear, onYearChange }) => {
  // Generate years from 2026 to 2099
  const startYear = 2026;
  const endYear = 2099;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  return (
    <header className="bg-[#091526] border-b border-blue-900 shadow-xl sticky top-0 z-50 h-20">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-full relative">
        <div className="flex justify-between items-center h-full">
          
          {/* Branding Section - Left */}
          <div className="flex items-center gap-6 z-20 relative shrink-0">
             <div className="flex flex-col group select-none cursor-default">
               <div className="flex items-baseline">
                  <span className="text-3xl font-black text-white tracking-widest font-sans leading-none" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>SAHER</span>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mx-1 mb-1 animate-pulse"></div>
               </div>
               <span className="text-[0.65rem] text-blue-300 uppercase tracking-[0.25em] font-semibold leading-tight text-justify flex justify-between w-full">
                 <span>For</span> <span>Smart</span> <span>Services</span>
               </span>
            </div>
          </div>

          {/* Centered Title Section - Absolute Center */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center text-center w-full pointer-events-none hidden md:flex z-10">
              <span className="text-yellow-500 text-xs font-bold tracking-wider mb-1 shadow-black drop-shadow-sm px-2">
                إدارة الخدمات العامة / قسم إدارة المرافق
              </span>
              <h1 className="text-lg font-bold text-white leading-tight opacity-95 whitespace-nowrap" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                نظام تسجيل نسبة استهلاك الماء والكهرباء لمقرات ساهر
              </h1>
          </div>

          {/* Controls - Right */}
          <div className="flex items-center gap-4 z-20 relative shrink-0">
            <div className="flex items-center bg-blue-950/50 rounded-lg p-1 border border-blue-800/50 shadow-inner group hover:border-blue-600 transition-colors">
              <span className="px-2 text-blue-300 text-xs font-medium hidden lg:inline ml-1">السنة المالية:</span>
              <select 
                value={currentYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="bg-transparent border-none text-sm font-bold text-white focus:ring-0 rounded py-0 pl-2 pr-6 cursor-pointer outline-none [&>option]:text-slate-900 font-mono h-8"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="px-2 text-yellow-500 border-r border-blue-800/50 mr-1 group-hover:text-yellow-400 transition-colors">
                <Calendar size={18} />
              </div>
            </div>
            
            <button className="p-2.5 text-blue-300 hover:text-white hover:bg-blue-800/50 rounded-full transition-all duration-200">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;