import React, { useState } from 'react';
import { AnnualSite, AnnualConsumptionRecord } from '../../types.ts';
import { formatNumber, calculateDiff, DiffResult } from './annualHelpers.ts';
import {
  Droplets,
  Zap,
  TrendingDown,
  TrendingUp,
  Building,
  Award,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Flame,
  CheckCircle,
} from 'lucide-react';

interface AnnualKPIsProps {
  baseYear: number;
  currentYear: number;
  sites: AnnualSite[];
  records: Record<string, Record<number, AnnualConsumptionRecord>>;
  totals: {
    waterBase: number;
    waterCurrent: number;
    waterDiff: number;
    waterPercent: number | null;
    electricityBase: number;
    electricityCurrent: number;
    electricityDiff: number;
    electricityPercent: number | null;
  };
}

export const AnnualKPIs: React.FC<AnnualKPIsProps> = ({
  baseYear,
  currentYear,
  sites,
  records,
  totals,
}) => {
  const [showCharts, setShowCharts] = useState(true);

  const activeSites = sites.filter((s) => !s.archived);

  // Analyze sites for extremes
  let maxWaterSite: { name: string; value: number } | null = null;
  let maxElecSite: { name: string; value: number } | null = null;
  let bestSavingSite: { name: string; percent: number; type: 'water' | 'electricity' } | null = null;

  activeSites.forEach((site) => {
    const curRec = records[site.id]?.[currentYear];
    const baseRec = records[site.id]?.[baseYear];

    const curWater = curRec?.water ?? null;
    const baseWater = baseRec?.water ?? null;
    const curElec = curRec?.electricity ?? null;
    const baseElec = baseRec?.electricity ?? null;

    if (curWater !== null) {
      if (!maxWaterSite || curWater > maxWaterSite.value) {
        maxWaterSite = { name: site.name, value: curWater };
      }
    }

    if (curElec !== null) {
      if (!maxElecSite || curElec > maxElecSite.value) {
        maxElecSite = { name: site.name, value: curElec };
      }
    }

    // Check savings
    const wDiff = calculateDiff(curWater, baseWater);
    if (wDiff.percent !== null && wDiff.percent < 0) {
      if (!bestSavingSite || wDiff.percent < bestSavingSite.percent) {
        bestSavingSite = { name: site.name, percent: wDiff.percent, type: 'water' };
      }
    }

    const eDiff = calculateDiff(curElec, baseElec);
    if (eDiff.percent !== null && eDiff.percent < 0) {
      if (!bestSavingSite || eDiff.percent < bestSavingSite.percent) {
        bestSavingSite = { name: site.name, percent: eDiff.percent, type: 'electricity' };
      }
    }
  });

  // Calculate highest values for chart scaling
  const maxWaterVal = Math.max(
    1,
    ...activeSites.map((s) =>
      Math.max(records[s.id]?.[baseYear]?.water || 0, records[s.id]?.[currentYear]?.water || 0)
    )
  );

  const maxElecVal = Math.max(
    1,
    ...activeSites.map((s) =>
      Math.max(records[s.id]?.[baseYear]?.electricity || 0, records[s.id]?.[currentYear]?.electricity || 0)
    )
  );

  return (
    <div className="space-y-4 print:hidden">
      {/* 8 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Water */}
        <div className="bg-gradient-to-br from-blue-50 to-sky-50/50 border border-blue-200 rounded-xl p-3.5 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">إجمالي استهلاك المياه ({currentYear})</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
              <Droplets size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-blue-900 font-mono">
              {formatNumber(totals.waterCurrent)}
            </span>
            <span className="text-xs text-blue-700 font-medium">متر مكعب</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <span>سنة {baseYear}:</span>
            <strong className="font-mono">{formatNumber(totals.waterBase)} م³</strong>
          </div>
        </div>

        {/* Card 2: Water Change % */}
        <div
          className={`border rounded-xl p-3.5 shadow-sm relative overflow-hidden transition-all ${
            totals.waterDiff < 0
              ? 'bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-200 hover:border-emerald-400'
              : totals.waterDiff > 0
              ? 'bg-gradient-to-br from-rose-50 to-red-50/50 border-red-200 hover:border-red-400'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">نسبة التغير السنوي للمياه</span>
            <div
              className={`p-1.5 rounded-lg ${
                totals.waterDiff < 0
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : totals.waterDiff > 0
                  ? 'bg-red-500/10 text-red-600'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {totals.waterDiff < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-black font-mono ${
                totals.waterDiff < 0 ? 'text-emerald-700' : totals.waterDiff > 0 ? 'text-red-700' : 'text-slate-700'
              }`}
            >
              {totals.waterPercent !== null
                ? `${totals.waterPercent > 0 ? '+' : ''}${totals.waterPercent.toFixed(1)}%`
                : 'غير متاحة'}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                totals.waterDiff < 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : totals.waterDiff > 0
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {totals.waterDiff < 0 ? 'وفر واستهلاك أقل' : totals.waterDiff > 0 ? 'ارتفاع بالاستهلاك' : 'استقرار'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            الفرق: <strong>{totals.waterDiff > 0 ? '+' : ''}{formatNumber(totals.waterDiff)} م³</strong>
          </div>
        </div>

        {/* Card 3: Total Electricity */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 rounded-xl p-3.5 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">إجمالي استهلاك الكهرباء ({currentYear})</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Zap size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
              {formatNumber(totals.electricityCurrent)}
            </span>
            <span className="text-xs text-amber-700 font-medium">كيلو واط</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <span>سنة {baseYear}:</span>
            <strong className="font-mono">{formatNumber(totals.electricityBase)} ك.و</strong>
          </div>
        </div>

        {/* Card 4: Electricity Change % */}
        <div
          className={`border rounded-xl p-3.5 shadow-sm relative overflow-hidden transition-all ${
            totals.electricityDiff < 0
              ? 'bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-200 hover:border-emerald-400'
              : totals.electricityDiff > 0
              ? 'bg-gradient-to-br from-rose-50 to-red-50/50 border-red-200 hover:border-red-400'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">نسبة التغير السنوي للكهرباء</span>
            <div
              className={`p-1.5 rounded-lg ${
                totals.electricityDiff < 0
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : totals.electricityDiff > 0
                  ? 'bg-red-500/10 text-red-600'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {totals.electricityDiff < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-black font-mono ${
                totals.electricityDiff < 0 ? 'text-emerald-700' : totals.electricityDiff > 0 ? 'text-red-700' : 'text-slate-700'
              }`}
            >
              {totals.electricityPercent !== null
                ? `${totals.electricityPercent > 0 ? '+' : ''}${totals.electricityPercent.toFixed(1)}%`
                : 'غير متاحة'}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                totals.electricityDiff < 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : totals.electricityDiff > 0
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {totals.electricityDiff < 0 ? 'وفر واستهلاك أقل' : totals.electricityDiff > 0 ? 'ارتفاع بالاستهلاك' : 'استقرار'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            الفرق: <strong>{totals.electricityDiff > 0 ? '+' : ''}{formatNumber(totals.electricityDiff)} ك.و</strong>
          </div>
        </div>

        {/* Card 5: Registered Sites */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">المقرات المسجلة</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Building size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-800 font-mono">
              {activeSites.length}
            </span>
            <span className="text-xs text-slate-500">مقرات نشطة</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            إجمالي المنشآت: <strong>{sites.length}</strong> (تشمل الأرشيف)
          </div>
        </div>

        {/* Card 6: Highest Water Site */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">المقر الأعلى استهلاكاً للمياه</span>
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Flame size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-slate-800 truncate" title={maxWaterSite?.name || '—'}>
              {maxWaterSite?.name || '—'}
            </div>
          </div>
          <div className="mt-1 text-[11px] text-blue-600 font-mono">
            الاستهلاك: <strong>{maxWaterSite ? formatNumber(maxWaterSite.value) : '0'} م³</strong>
          </div>
        </div>

        {/* Card 7: Highest Elec Site */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">المقر الأعلى استهلاكاً للكهرباء</span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Flame size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-slate-800 truncate" title={maxElecSite?.name || '—'}>
              {maxElecSite?.name || '—'}
            </div>
          </div>
          <div className="mt-1 text-[11px] text-amber-600 font-mono">
            الاستهلاك: <strong>{maxElecSite ? formatNumber(maxElecSite.value) : '0'} ك.و</strong>
          </div>
        </div>

        {/* Card 8: Best Saving Site */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">المقر الأكثر انخفاضاً وتوفيراً</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-emerald-800 truncate" title={bestSavingSite?.name || '—'}>
              {bestSavingSite?.name || 'لا يوجد انخفاض مسجل'}
            </div>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-mono">
            {bestSavingSite ? `انخفاض بمعدل ${bestSavingSite.percent.toFixed(1)}%` : 'استهلاك ثابت أو متزايد'}
          </div>
        </div>
      </div>

      {/* Interactive Comparison Charts Toggle */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowCharts(!showCharts)}
          className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition"
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-600" />
            <span>الرسوم البيانية التفاعلية لمقارنة المقرات بين سنتي {baseYear} و {currentYear}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <span>{showCharts ? 'إخفاء الرسوم البيانية' : 'عرض الرسوم البيانية'}</span>
            {showCharts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {showCharts && (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-slate-200 animate-in fade-in duration-300">
            {/* Water Chart */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Droplets size={16} className="text-blue-600" />
                  <span>مقارنة استهلاك المياه (متر مكعب)</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-300 inline-block"></span> {baseYear}
                  </span>
                  <span className="flex items-center gap-1 text-slate-800 font-bold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block"></span> {currentYear}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {activeSites.map((site) => {
                  const bVal = records[site.id]?.[baseYear]?.water || 0;
                  const cVal = records[site.id]?.[currentYear]?.water || 0;
                  const bWidth = Math.min(100, Math.round((bVal / maxWaterVal) * 100));
                  const cWidth = Math.min(100, Math.round((cVal / maxWaterVal) * 100));
                  const diff = calculateDiff(cVal, bVal);

                  return (
                    <div key={`chart-water-${site.id}`} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={site.name}>
                          {site.name}
                        </span>
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            diff.diff && diff.diff < 0
                              ? 'text-emerald-600'
                              : diff.diff && diff.diff > 0
                              ? 'text-red-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {diff.percentText}
                        </span>
                      </div>

                      {/* Bar 1: Base */}
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-300 h-full rounded-full transition-all duration-500"
                            style={{ width: `${bWidth}%` }}
                          ></div>
                        </div>
                        <span className="w-16 text-left text-slate-500">{formatNumber(bVal)}</span>
                      </div>

                      {/* Bar 2: Current */}
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${cWidth}%` }}
                          ></div>
                        </div>
                        <span className="w-16 text-left text-blue-900 font-bold">{formatNumber(cVal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Electricity Chart */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Zap size={16} className="text-amber-600" />
                  <span>مقارنة استهلاك الكهرباء (كيلو واط)</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-300 inline-block"></span> {baseYear}
                  </span>
                  <span className="flex items-center gap-1 text-slate-800 font-bold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-600 inline-block"></span> {currentYear}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {activeSites.map((site) => {
                  const bVal = records[site.id]?.[baseYear]?.electricity || 0;
                  const cVal = records[site.id]?.[currentYear]?.electricity || 0;
                  const bWidth = Math.min(100, Math.round((bVal / maxElecVal) * 100));
                  const cWidth = Math.min(100, Math.round((cVal / maxElecVal) * 100));
                  const diff = calculateDiff(cVal, bVal);

                  return (
                    <div key={`chart-elec-${site.id}`} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={site.name}>
                          {site.name}
                        </span>
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            diff.diff && diff.diff < 0
                              ? 'text-emerald-600'
                              : diff.diff && diff.diff > 0
                              ? 'text-red-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {diff.percentText}
                        </span>
                      </div>

                      {/* Bar 1: Base */}
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-300 h-full rounded-full transition-all duration-500"
                            style={{ width: `${bWidth}%` }}
                          ></div>
                        </div>
                        <span className="w-20 text-left text-slate-500">{formatNumber(bVal)}</span>
                      </div>

                      {/* Bar 2: Current */}
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${cWidth}%` }}
                          ></div>
                        </div>
                        <span className="w-20 text-left text-amber-900 font-bold">{formatNumber(cVal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
