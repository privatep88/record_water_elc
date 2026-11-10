import React, { useMemo } from 'react';
import { SiteData, MONTHS, RowType } from '../types.ts';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyKpiCardsProps {
  currentSites: SiteData[];
  previousYearSites?: SiteData[];
}

const sumSiteRowsByKeyword = (sites: SiteData[], keyword: string, isCostRow: boolean): number => {
  let total = 0;
  sites.forEach((site) => {
    site.rows.forEach((row) => {
      if (row.type === RowType.INPUT && Boolean(row.isCost) === isCostRow) {
        if (row.label.includes(keyword)) {
          MONTHS.forEach((m) => {
            total += Number(row.values[m.key] || 0);
          });
        }
      }
    });
  });
  return Math.round((total + Number.EPSILON) * 100) / 100;
};

const sumTotalCost = (sites: SiteData[]): number => {
  let total = 0;
  sites.forEach((site) => {
    const calcRow = site.rows.find((r) => r.type === RowType.CALCULATED_TOTAL);
    if (calcRow) {
      MONTHS.forEach((m) => {
        total += Number(calcRow.values[m.key] || 0);
      });
    } else {
      site.rows
        .filter((r) => r.isCost)
        .forEach((row) => {
          MONTHS.forEach((m) => {
            total += Number(row.values[m.key] || 0);
          });
        });
    }
  });
  return Math.round((total + Number.EPSILON) * 100) / 100;
};

const formatKpiDecimal = (val: number): string => {
  return val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const MonthlyKpiCards: React.FC<MonthlyKpiCardsProps> = ({
  currentSites,
  previousYearSites = [],
}) => {
  const metrics = useMemo(() => {
    const totalWater = sumSiteRowsByKeyword(currentSites, 'الماء', false) + sumSiteRowsByKeyword(currentSites, 'المياه', false);
    const totalElectricity = sumSiteRowsByKeyword(currentSites, 'الكهرباء', false);
    const totalCost = sumTotalCost(currentSites);
    const sitesCount = currentSites.length;

    const prevCost = sumTotalCost(previousYearSites);
    const prevWater = sumSiteRowsByKeyword(previousYearSites, 'الماء', false) + sumSiteRowsByKeyword(previousYearSites, 'المياه', false);
    const prevElec = sumSiteRowsByKeyword(previousYearSites, 'الكهرباء', false);

    const currentCombined = totalCost > 0 ? totalCost : totalWater + totalElectricity;
    const prevCombined = prevCost > 0 ? prevCost : prevWater + prevElec;

    let comparisonPercent = 0;
    if (prevCombined > 0) {
      comparisonPercent = ((currentCombined - prevCombined) / prevCombined) * 100;
    }

    return {
      totalWater,
      totalElectricity,
      totalCost,
      sitesCount,
      comparisonPercent,
    };
  }, [currentSites, previousYearSites]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-5 print:hidden">
      {/* Card 1 (Rightmost in RTL): إجمالي استهلاك المياه */}
      <div className="bg-gradient-to-l from-[#e0f2fe]/90 via-[#f0f9ff] to-[#bae6fd]/50 border border-[#bae6fd] rounded-2xl px-4 py-3.5 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
        <div className="flex flex-col items-center text-center flex-1">
          <span className="text-xs sm:text-[13px] font-bold text-slate-800 whitespace-nowrap">
            إجمالي استهلاك المياه
          </span>
          <span className="text-2xl sm:text-[26px] font-black font-mono tabular-nums text-[#0369a1] leading-tight my-1">
            {formatKpiDecimal(metrics.totalWater)}
          </span>
          <span className="text-[11px] font-semibold text-slate-600">
            متر مكعب (m³)
          </span>
        </div>
        <div className="shrink-0 mr-2">
          <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M24 4C24 4 10 20.5 10 31C10 38.732 16.268 45 24 45C31.732 45 38 38.732 38 31C38 20.5 24 4 24 4Z"
              fill="url(#water_grad)"
              stroke="#0284c7"
              strokeWidth="2"
            />
            <path
              d="M17 31C17 26.5 20 21 20 21C20 21 15 26.5 15 31.5C15 35.5 18 39 22 39.5C19 38 17 35 17 31Z"
              fill="white"
              fillOpacity="0.65"
            />
            <defs>
              <linearGradient id="water_grad" x1="10" y1="4" x2="38" y2="45" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7dd3fc" />
                <stop offset="0.5" stopColor="#38bdf8" />
                <stop offset="1" stopColor="#0284c7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Card 2: إجمالي استهلاك الكهرباء */}
      <div className="bg-gradient-to-l from-[#fef3c7]/80 via-[#fffbeb] to-[#fde68a]/40 border border-[#fde68a] rounded-2xl px-4 py-3.5 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
        <div className="flex flex-col items-center text-center flex-1">
          <span className="text-xs sm:text-[13px] font-bold text-slate-800 whitespace-nowrap">
            إجمالي استهلاك الكهرباء
          </span>
          <span className="text-2xl sm:text-[26px] font-black font-mono tabular-nums text-[#b45309] leading-tight my-1">
            {formatKpiDecimal(metrics.totalElectricity)}
          </span>
          <span className="text-[11px] font-semibold text-slate-600">
            كيلوواط ساعة (kWh)
          </span>
        </div>
        <div className="shrink-0 mr-2">
          <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M27 4L10 26H23L20 44L39 21H25.5L27 4Z"
              fill="url(#elec_grad)"
              stroke="#d97706"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="elec_grad" x1="10" y1="4" x2="39" y2="44" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fde047" />
                <stop offset="0.5" stopColor="#facc15" />
                <stop offset="1" stopColor="#ea580c" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Card 3: إجمالي تكلفة الاستهلاك */}
      <div className="bg-gradient-to-l from-[#fef9c3]/75 via-[#fefce8] to-[#fef08a]/40 border border-[#fde047]/80 rounded-2xl px-4 py-3.5 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
        <div className="flex flex-col items-center text-center flex-1">
          <span className="text-xs sm:text-[13px] font-bold text-slate-800 whitespace-nowrap">
            إجمالي تكلفة الاستهلاك
          </span>
          <span className="text-2xl sm:text-[26px] font-black font-mono tabular-nums text-[#b45309] leading-tight my-1">
            {formatKpiDecimal(metrics.totalCost)}
          </span>
          <span className="text-[11px] font-semibold text-slate-600">
            درهم إماراتي
          </span>
        </div>
        <div className="shrink-0 mr-2">
          <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="24" cy="13" rx="14" ry="5.5" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
            <path d="M10 13V20C10 23.0376 16.268 25.5 24 25.5C31.732 25.5 38 23.0376 38 20V13" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
            <path d="M10 20V27C10 30.0376 16.268 32.5 24 32.5C31.732 32.5 38 30.0376 38 27V20" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
            <path d="M10 27V34C10 37.0376 16.268 39.5 24 39.5C31.732 39.5 38 37.0376 38 34V27" fill="#ca8a04" stroke="#a16207" strokeWidth="2" />
            <ellipse cx="24" cy="13" rx="11" ry="3.8" fill="#fef08a" />
          </svg>
        </div>
      </div>

      {/* Card 4: عدد المقرات المسجلة */}
      <div className="bg-gradient-to-l from-[#f1f5f9] via-white to-[#e0f2fe]/45 border border-slate-200 rounded-2xl px-4 py-3.5 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
        <div className="flex flex-col items-center text-center flex-1">
          <span className="text-xs sm:text-[13px] font-bold text-slate-800 whitespace-nowrap">
            عدد المقرات المسجلة
          </span>
          <span className="text-2xl sm:text-[26px] font-black font-mono tabular-nums text-[#0f172a] leading-tight my-1">
            {metrics.sitesCount}
          </span>
          <span className="text-[11px] font-semibold text-slate-600">
            مقرات
          </span>
        </div>
        <div className="shrink-0 mr-2 text-[#0284c7]">
          <Building2 size={40} strokeWidth={1.8} />
        </div>
      </div>

      {/* Card 5 (Leftmost in RTL): مقارنة الاستهلاك */}
      <div className="bg-gradient-to-l from-[#dcfce7]/80 via-[#f0fdf4] to-[#bbf7d0]/50 border border-[#bbf7d0] rounded-2xl px-4 py-3.5 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
        <div className="flex flex-col items-center text-center flex-1">
          <span className="text-xs sm:text-[13px] font-bold text-slate-800 whitespace-nowrap">
            مقارنة الاستهلاك
          </span>
          <span
            dir="ltr"
            className={`text-2xl sm:text-[26px] font-black font-mono tabular-nums leading-tight my-1 ${
              metrics.comparisonPercent > 0 ? 'text-rose-700' : 'text-[#15803d]'
            }`}
          >
            {metrics.comparisonPercent > 0 ? '+' : ''}
            {metrics.comparisonPercent.toFixed(1)}%
          </span>
          <span className="text-[11px] font-semibold text-slate-600">
            مقارنة بالسنة السابقة
          </span>
        </div>
        <div className="shrink-0 mr-2 text-[#16a34a]">
          {metrics.comparisonPercent < 0 ? (
            <TrendingDown size={40} strokeWidth={2.2} />
          ) : (
            <TrendingUp size={40} strokeWidth={2.2} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyKpiCards;
