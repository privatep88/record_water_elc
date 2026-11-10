import React from 'react';
import { Calendar, LoaderCircle, CheckCircle, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentYear: number;
  onYearChange: (year: number) => void;
  autoSaveStatus: 'idle' | 'saving' | 'saved';
}

const Header: React.FC<HeaderProps> = ({ currentYear, onYearChange, autoSaveStatus }) => {
  const startYear = 2020;
  const endYear = 2099;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  return (
    <header className="bg-[#091526] border-b-[3px] border-[#eab308] shadow-lg sticky top-0 z-50 h-20 sm:h-24 print:hidden transition-all duration-200">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-full relative">
        <div className="flex justify-between items-center h-full">
          {/* Right Zone (RTL Start): SAHER Brand Lockup */}
          <div className="flex items-center gap-4 z-20 relative shrink-0">
            <div className="flex items-center gap-3.5 group select-none cursor-default">
              {/* Blue Square S Icon (Far Right in RTL) */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e3a8a] rounded-2xl shadow-md flex items-center justify-center border border-blue-400/40 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/15 blur-[0.5px]" />
                <span className="font-black text-3xl sm:text-4xl text-white italic relative z-10 drop-shadow-sm font-sans">
                  S
                </span>
                <div className="absolute bottom-2 right-2 w-2.5 h-2.5 bg-[#eab308] rounded-full shadow-[0_0_6px_rgba(234,179,8,0.9)]" />
              </div>

              {/* SAHER Wordmark */}
              <div className="flex flex-col justify-center text-left" dir="ltr">
                <span className="text-2xl sm:text-[34px] font-black text-white tracking-wider leading-none font-sans">
                  SAHER
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-blue-100 tracking-[0.16em] uppercase whitespace-nowrap">
                    FOR SMART SERVICES
                  </span>
                  <div className="h-[2.5px] w-4 bg-[#eab308] rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Center Zone: Department & System Title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex flex-col justify-center items-center text-center pointer-events-none z-10">
            <span className="text-[#f59e0b] text-base lg:text-lg font-extrabold tracking-wide mb-1 drop-shadow-xs whitespace-nowrap">
              إدارة الخدمات العامة / قسم إدارة المرافق
            </span>
            <h1 className="text-base lg:text-xl font-bold text-white leading-snug whitespace-nowrap drop-shadow-sm">
              نظام تسجيل ومتابعة استهلاك المياه والكهرباء لمقرات ساهر
            </h1>
          </div>

          {/* Left Zone (RTL End): Fiscal Year Selector & Auto-Save Status */}
          <div className="flex items-center gap-3 z-20 relative shrink-0">
            {/* Auto-save feedback */}
            {autoSaveStatus !== 'idle' && (
              <div className="hidden lg:flex items-center gap-1.5 bg-[#112240]/90 rounded-xl px-3 py-2 border border-blue-800/60 text-xs">
                {autoSaveStatus === 'saving' && (
                  <>
                    <LoaderCircle size={15} className="animate-spin text-blue-300" />
                    <span className="text-blue-200 font-medium">جاري الحفظ...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <CheckCircle size={15} className="text-emerald-400" />
                    <span className="text-emerald-400 font-medium">تم الحفظ تلقائياً</span>
                  </>
                )}
              </div>
            )}

            {/* Fiscal Year Control Box */}
            <div className="flex items-center bg-[#112240]/90 rounded-xl px-3.5 py-2 border border-blue-800/70 shadow-inner hover:border-blue-600 transition-colors">
              <span className="text-blue-200 text-xs sm:text-sm font-medium ml-2 whitespace-nowrap">
                السنة المالية:
              </span>
              <div className="relative flex items-center">
                <select
                  value={currentYear}
                  onChange={(e) => onYearChange(Number(e.target.value))}
                  aria-label="السنة المالية"
                  className="appearance-none bg-transparent border-none text-base sm:text-lg font-bold text-white focus:ring-0 py-0 pl-6 pr-1 cursor-pointer outline-none [&>option]:text-slate-900 font-mono tabular-nums"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="text-blue-300 pointer-events-none absolute left-1" />
              </div>
              <div className="pr-2.5 mr-1.5 border-r border-blue-800/70 text-[#eab308] flex items-center">
                <Calendar size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;