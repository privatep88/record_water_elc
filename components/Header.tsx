import React from 'react';
import { Calendar, LoaderCircle, CheckCircle } from 'lucide-react';

interface HeaderProps {
  currentYear: number;
  onYearChange: (year: number) => void;
  autoSaveStatus: 'idle' | 'saving' | 'saved';
}

const Header: React.FC<HeaderProps> = ({ currentYear, onYearChange, autoSaveStatus }) => {
  // Generate years from 2026 to 2099
  const startYear = 2026;
  const endYear = 2099;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  return (
    <header className="bg-[#091526] border-b-4 border-[#eab308] shadow-xl sticky top-0 z-50 h-28 print:hidden transition-all duration-300">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-full relative">
        <div className="flex justify-between items-center h-full">
          
          {/* Branding Section - Right (RTL Start) */}
          <div className="flex items-center gap-6 z-20 relative shrink-0">
             <div className="flex items-center gap-5 group select-none cursor-default">
               {/* Logo Mark */}
               <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 rounded-2xl shadow-lg flex items-center justify-center border border-blue-500/30 overflow-hidden transform group-hover:scale-105 transition-all duration-300">
                   {/* Gloss effect */}
                   <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 blur-[1px]"></div>
                   
                   {/* The Letter S */}
                   <span className="font-black text-4xl text-white italic relative z-10 drop-shadow-md font-sans">S</span>
                   
                   {/* Dot/Accent */}
                   <div className="absolute bottom-2.5 right-2.5 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse"></div>
               </div>

               {/* Text Logo */}
               <div className="flex flex-col justify-center">
                   <h1 className="text-4xl font-black text-white tracking-wider leading-none font-sans drop-shadow-sm">
                       SAHER
                   </h1>
                   <div className="flex items-center gap-2 mt-1.5">
                       <div className="h-[3px] w-5 bg-yellow-500 rounded-full"></div>
                       <span className="text-xs font-bold text-blue-200 tracking-[0.2em] uppercase group-hover:text-white transition-colors whitespace-nowrap">
                           FOR SMART SERVICES
                       </span>
                   </div>
               </div>
            </div>
          </div>

          {/* Centered Title Section - Absolute Center */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center text-center w-full pointer-events-none hidden md:flex z-10">
              <span className="text-yellow-500 text-lg font-bold tracking-wider mb-2 shadow-black drop-shadow-sm px-3 py-0.5 rounded bg-blue-950/30 border border-blue-900/30 backdrop-blur-sm">
                إدارة الخدمات العامة / قسم إدارة المرافق
              </span>
              <h1 className="text-lg md:text-xl font-bold text-white leading-tight opacity-95 whitespace-nowrap drop-shadow-md">
                نظام تسجيل نسبة استهلاك الماء والكهرباء لمقرات ساهر
              </h1>
          </div>

          {/* Controls - Left (RTL End) */}
          <div className="flex items-center gap-4 z-20 relative shrink-0">
            {/* Auto Save Status Indicator */}
            <div className="relative h-10 w-40 hidden lg:block">
              <div className={`absolute inset-0 flex items-center justify-center bg-blue-950/50 rounded-xl p-2 border border-blue-800/50 shadow-inner text-xs transition-opacity duration-300 ${autoSaveStatus !== 'idle' ? 'opacity-100' : 'opacity-0'}`}>
                   {autoSaveStatus === 'saving' && (
                     <>
                       <LoaderCircle size={16} className="animate-spin text-blue-300 mr-2" />
                       <span className="text-blue-300">جاري الحفظ...</span>
                     </>
                   )}
                   {autoSaveStatus === 'saved' && (
                     <>
                       <CheckCircle size={16} className="text-green-400 mr-2" />
                       <span className="text-green-400">تم الحفظ تلقائياً</span>
                     </>
                   )}
              </div>
            </div>

            <div className="flex items-center bg-blue-950/50 rounded-xl p-2 border border-blue-800/50 shadow-inner group hover:border-blue-600 transition-colors">
              <span className="px-2 text-blue-300 text-sm font-medium hidden lg:inline ml-1">السنة المالية:</span>
              <select 
                value={currentYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="bg-transparent border-none text-lg font-bold text-white focus:ring-0 rounded py-0 pl-2 pr-8 cursor-pointer outline-none [&>option]:text-slate-900 font-mono h-10"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="px-2 text-yellow-500 border-r border-blue-800/50 mr-1 group-hover:text-yellow-400 transition-colors">
                <Calendar size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;