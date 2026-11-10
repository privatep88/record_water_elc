import React, { useState } from 'react';
import { AnnualSite, AnnualConsumptionRecord } from '../../types.ts';
import { formatNumber, calculateDiff, roundTo } from './annualHelpers.ts';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  MoreVertical,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  Printer,
  Edit3,
  Check,
} from 'lucide-react';

interface AnnualTableProps {
  baseYear: number;
  currentYear: number;
  sites: AnnualSite[];
  records: Record<string, Record<number, AnnualConsumptionRecord>>;
  onUpdateConsumption: (
    siteId: string,
    year: number,
    field: 'water' | 'electricity',
    value: number | null
  ) => void;
  onUpdateSite?: (id: string, updates: Partial<AnnualSite>) => void;
  onOpenMonthlyModal: (site: AnnualSite, year: number) => void;
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

export const AnnualTable: React.FC<AnnualTableProps> = ({
  baseYear,
  currentYear,
  sites,
  records,
  onUpdateConsumption,
  onUpdateSite,
  onOpenMonthlyModal,
  totals,
}) => {
  // State for tracking which cell is being edited inline
  const [editingCell, setEditingCell] = useState<{
    siteId: string;
    year: number;
    field: 'water' | 'electricity';
  } | null>(null);

  const [tempValue, setTempValue] = useState<string>('');
  const [editingSiteNameId, setEditingSiteNameId] = useState<string | null>(null);
  const [tempSiteName, setTempSiteName] = useState<string>('');

  const activeSites = sites.filter((s) => !s.archived);

  const handleStartEdit = (
    siteId: string,
    year: number,
    field: 'water' | 'electricity',
    currentVal: number | null | undefined
  ) => {
    setEditingCell({ siteId, year, field });
    setTempValue(currentVal !== null && currentVal !== undefined ? String(currentVal) : '');
  };

  const handleFinishEdit = () => {
    if (!editingCell) return;
    const { siteId, year, field } = editingCell;

    if (tempValue.trim() === '') {
      onUpdateConsumption(siteId, year, field, null);
    } else {
      const parsed = parseFloat(tempValue);
      if (!isNaN(parsed) && parsed >= 0) {
        onUpdateConsumption(siteId, year, field, roundTo(parsed));
      }
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Container with High-Fidelity Enterprise Styling */}
      <div className="overflow-x-auto border-2 border-[#091526] rounded-xl shadow-lg bg-white print:border-none print:shadow-none">
        <table className="w-full text-sm text-center border-collapse min-w-[1100px] table-fixed">
          {/* Table Headers */}
          <thead>
            {/* Top Header Row with Exact Requested Colors:
                1. المقر -> Light Blue (#e0f2fe)
                2 & 3. استهلاك الماء -> Light Orange (#ffedd5)
                4. فرق الماء -> Light Green (#dcfce7)
                5 & 6. استهلاك الكهرباء -> Light Orange (#ffedd5)
                7. فرق الكهرباء -> Light Green (#dcfce7)
            */}
            <tr className="border-b-2 border-slate-700 text-xs sm:text-sm font-bold select-none">
              {/* 1. المقر (Light Blue) */}
              <th className="p-3.5 border-r border-slate-300 bg-[#e0f2fe] text-[#0369a1] w-[220px] align-middle shadow-sm">
                <div className="flex items-center justify-center gap-1.5 font-black text-sm">
                  <Building2 size={16} />
                  <span>المقر</span>
                </div>
              </th>

              {/* 2. إجمالي استهلاك الماء سنة الأساس (Light Orange) */}
              <th className="p-3 border-r border-slate-300 bg-[#ffedd5] text-[#9a3412] w-[140px] align-middle">
                <div className="flex flex-col items-center justify-center">
                  <span className="font-black">إجمالي استهلاك الماء</span>
                  <span className="text-[11px] font-bold text-amber-900/80">(متر مكعب) {baseYear}</span>
                </div>
              </th>

              {/* 3. إجمالي استهلاك الماء السنة الحالية (Light Orange) */}
              <th className="p-3 border-r border-slate-300 bg-[#ffedd5] text-[#9a3412] w-[140px] align-middle">
                <div className="flex flex-col items-center justify-center">
                  <span className="font-black">إجمالي استهلاك الماء</span>
                  <span className="text-[11px] font-bold text-amber-900/80">(متر مكعب) {currentYear}</span>
                </div>
              </th>

              {/* 4. فرق استهلاك الماء (Light Green) */}
              <th className="p-3 border-r border-slate-300 bg-[#dcfce7] text-[#166534] w-[160px] align-middle shadow-inner">
                <div className="flex flex-col items-center justify-center">
                  <span className="font-black">فرق استهلاك الماء</span>
                  <span className="text-[11px] font-bold text-emerald-900/80">({currentYear} - {baseYear})</span>
                </div>
              </th>

              {/* 5. إجمالي استهلاك الكهرباء سنة الأساس (Light Orange) */}
              <th className="p-3 border-r border-slate-300 bg-[#ffedd5] text-[#9a3412] w-[145px] align-middle">
                <div className="flex flex-col items-center justify-center">
                  <span className="font-black">إجمالي استهلاك الكهرباء</span>
                  <span className="text-[11px] font-bold text-amber-900/80">(كيلو واط) {baseYear}</span>
                </div>
              </th>

              {/* 6. إجمالي استهلاك الكهرباء السنة الحالية (Light Orange) */}
              <th className="p-3 border-r border-slate-300 bg-[#ffedd5] text-[#9a3412] w-[145px] align-middle">
                <div className="flex flex-col items-center justify-center">
                  <span className="font-black">إجمالي استهلاك الكهرباء</span>
                  <span className="text-[11px] font-bold text-amber-900/80">(كيلو واط) {currentYear}</span>
                </div>
              </th>

              {/* 7. فرق استهلاك الكهرباء (Light Green) */}
              <th className="p-3 border-r border-slate-300 bg-[#dcfce7] text-[#166534] w-[165px] align-middle shadow-inner">
                <div className="flex flex-col items-center justify-center">
                  <span className="font-black">فرق استهلاك الكهرباء</span>
                  <span className="text-[11px] font-bold text-emerald-900/80">({currentYear} - {baseYear})</span>
                </div>
              </th>

              {/* Action Column for detailed month input (Print Hidden) */}
              <th className="p-3 bg-[#091526] text-white w-[85px] align-middle print:hidden">
                <span className="text-xs font-bold">التفصيل</span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200">
            {activeSites.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                  لا توجد مقرات نشطة مسجلة. يمكنك إضافة مقرات جديدة عبر زر "إدارة المقرات".
                </td>
              </tr>
            ) : (
              activeSites.map((site, index) => {
                const baseRec = records[site.id]?.[baseYear];
                const curRec = records[site.id]?.[currentYear];

                const wBase = baseRec?.water ?? null;
                const wCur = curRec?.water ?? null;
                const wDiff = calculateDiff(wCur, wBase);

                const eBase = baseRec?.electricity ?? null;
                const eCur = curRec?.electricity ?? null;
                const eDiff = calculateDiff(eCur, eBase);

                const isEditingWBase =
                  editingCell?.siteId === site.id &&
                  editingCell?.year === baseYear &&
                  editingCell?.field === 'water';

                const isEditingWCur =
                  editingCell?.siteId === site.id &&
                  editingCell?.year === currentYear &&
                  editingCell?.field === 'water';

                const isEditingEBase =
                  editingCell?.siteId === site.id &&
                  editingCell?.year === baseYear &&
                  editingCell?.field === 'electricity';

                const isEditingECur =
                  editingCell?.siteId === site.id &&
                  editingCell?.year === currentYear &&
                  editingCell?.field === 'electricity';

                const isEven = index % 2 === 0;

                return (
                  <tr
                    key={site.id}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      isEven ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    {/* 1. المقر */}
                    <td
                      onClick={() => {
                        if (onUpdateSite && editingSiteNameId !== site.id) {
                          setEditingSiteNameId(site.id);
                          setTempSiteName(site.name);
                        }
                      }}
                      className="p-3 border-r border-slate-200 text-right pr-4 font-bold text-slate-800 bg-[#f8fafc] cursor-pointer group"
                      title="اضغط لتعديل اسم المقر (مرتبط بجدول الاستهلاك الشهري)"
                    >
                      <div className="flex flex-col">
                        {editingSiteNameId === site.id ? (
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              autoFocus
                              value={tempSiteName}
                              onChange={(e) => setTempSiteName(e.target.value)}
                              onBlur={() => {
                                if (tempSiteName.trim() && onUpdateSite) {
                                  onUpdateSite(site.id, { name: tempSiteName.trim() });
                                }
                                setEditingSiteNameId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (tempSiteName.trim() && onUpdateSite) {
                                    onUpdateSite(site.id, { name: tempSiteName.trim() });
                                  }
                                  setEditingSiteNameId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingSiteNameId(null);
                                }
                              }}
                              className="w-full p-1 text-xs border-2 border-blue-500 rounded bg-white shadow-xs font-bold text-slate-900 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (tempSiteName.trim() && onUpdateSite) {
                                  onUpdateSite(site.id, { name: tempSiteName.trim() });
                                }
                                setEditingSiteNameId(null);
                              }}
                              className="text-emerald-600 p-0.5 shrink-0"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-bold text-slate-900">{site.name}</span>
                            <Edit3
                              size={12}
                              className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity print:hidden shrink-0"
                            />
                          </div>
                        )}
                        {site.meterNumber && (
                          <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                            عداد: {site.meterNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. ماء سنة الأساس */}
                    <td
                      onClick={() => handleStartEdit(site.id, baseYear, 'water', wBase)}
                      className="p-2 border-r border-slate-200 cursor-pointer group hover:bg-amber-50/70 transition-all font-mono"
                      title="اضغط للتعديل المباشر"
                    >
                      {isEditingWBase ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="number"
                            autoFocus
                            step="any"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={handleFinishEdit}
                            onKeyDown={handleKeyDown}
                            className="w-24 text-center p-1 text-xs border-2 border-blue-500 rounded bg-white shadow-sm font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={handleFinishEdit}
                            className="text-emerald-600 p-0.5"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-bold text-slate-700">
                            {formatNumber(wBase)}
                          </span>
                          <Edit3
                            size={12}
                            className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                          />
                        </div>
                      )}
                    </td>

                    {/* 3. ماء سنة الحالية */}
                    <td
                      onClick={() => handleStartEdit(site.id, currentYear, 'water', wCur)}
                      className="p-2 border-r border-slate-200 cursor-pointer group hover:bg-amber-50/70 transition-all font-mono"
                      title="اضغط للتعديل المباشر"
                    >
                      {isEditingWCur ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="number"
                            autoFocus
                            step="any"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={handleFinishEdit}
                            onKeyDown={handleKeyDown}
                            className="w-24 text-center p-1 text-xs border-2 border-blue-500 rounded bg-white shadow-sm font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={handleFinishEdit}
                            className="text-emerald-600 p-0.5"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-bold text-slate-800">
                            {formatNumber(wCur)}
                          </span>
                          <Edit3
                            size={12}
                            className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                          />
                        </div>
                      )}
                    </td>

                    {/* 4. فرق استهلاك الماء (Auto Calculated) */}
                    <td className="p-2 border-r border-slate-200 align-middle">
                      {wDiff.diff === null ? (
                        <span className="text-slate-400 font-mono text-sm">—</span>
                      ) : (
                        <div
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs font-bold border ${
                            wDiff.status === 'increase'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : wDiff.status === 'decrease'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {wDiff.status === 'increase' && <TrendingUp size={13} className="shrink-0" />}
                          {wDiff.status === 'decrease' && <TrendingDown size={13} className="shrink-0" />}
                          {wDiff.status === 'zero' && <Minus size={13} className="shrink-0" />}
                          <span>{wDiff.diffText}</span>
                          <span className="text-[10px] opacity-85 mr-0.5">({wDiff.percentText})</span>
                        </div>
                      )}
                    </td>

                    {/* 5. كهرباء سنة الأساس */}
                    <td
                      onClick={() => handleStartEdit(site.id, baseYear, 'electricity', eBase)}
                      className="p-2 border-r border-slate-200 cursor-pointer group hover:bg-amber-50/70 transition-all font-mono"
                      title="اضغط للتعديل المباشر"
                    >
                      {isEditingEBase ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="number"
                            autoFocus
                            step="any"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={handleFinishEdit}
                            onKeyDown={handleKeyDown}
                            className="w-24 text-center p-1 text-xs border-2 border-blue-500 rounded bg-white shadow-sm font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={handleFinishEdit}
                            className="text-emerald-600 p-0.5"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-bold text-slate-700">
                            {formatNumber(eBase)}
                          </span>
                          <Edit3
                            size={12}
                            className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                          />
                        </div>
                      )}
                    </td>

                    {/* 6. كهرباء سنة الحالية */}
                    <td
                      onClick={() => handleStartEdit(site.id, currentYear, 'electricity', eCur)}
                      className="p-2 border-r border-slate-200 cursor-pointer group hover:bg-amber-50/70 transition-all font-mono"
                      title="اضغط للتعديل المباشر"
                    >
                      {isEditingECur ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="number"
                            autoFocus
                            step="any"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={handleFinishEdit}
                            onKeyDown={handleKeyDown}
                            className="w-24 text-center p-1 text-xs border-2 border-blue-500 rounded bg-white shadow-sm font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={handleFinishEdit}
                            className="text-emerald-600 p-0.5"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-bold text-slate-800">
                            {formatNumber(eCur)}
                          </span>
                          <Edit3
                            size={12}
                            className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                          />
                        </div>
                      )}
                    </td>

                    {/* 7. فرق استهلاك الكهرباء (Auto Calculated) */}
                    <td className="p-2 border-r border-slate-200 align-middle">
                      {eDiff.diff === null ? (
                        <span className="text-slate-400 font-mono text-sm">—</span>
                      ) : (
                        <div
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs font-bold border ${
                            eDiff.status === 'increase'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : eDiff.status === 'decrease'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {eDiff.status === 'increase' && <TrendingUp size={13} className="shrink-0" />}
                          {eDiff.status === 'decrease' && <TrendingDown size={13} className="shrink-0" />}
                          {eDiff.status === 'zero' && <Minus size={13} className="shrink-0" />}
                          <span>{eDiff.diffText}</span>
                          <span className="text-[10px] opacity-85 mr-0.5">({eDiff.percentText})</span>
                        </div>
                      )}
                    </td>

                    {/* Action buttons (Print Hidden) */}
                    <td className="p-2 align-middle print:hidden">
                      <button
                        type="button"
                        onClick={() => onOpenMonthlyModal(site, currentYear)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-1.5 rounded-lg border border-blue-200 text-xs font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                        title="إدخال وعرض الاستهلاك الشهري (12 شهر)"
                      >
                        <CalendarDays size={14} />
                        <span className="text-[11px]">شهري</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Totals Summary Footer */}
          <tfoot>
            <tr className="bg-[#091526] text-white font-bold text-xs sm:text-sm border-t-2 border-slate-900 shadow-md">
              {/* المقر -> المجموع */}
              <td className="p-3.5 border-r border-slate-700 text-center font-black">
                المجموع الكلي
              </td>

              {/* مجموع ماء أساس */}
              <td className="p-3 border-r border-slate-700 font-mono font-bold text-blue-200">
                {formatNumber(totals.waterBase)}
              </td>

              {/* مجموع ماء حالي */}
              <td className="p-3 border-r border-slate-700 font-mono font-bold text-blue-100">
                {formatNumber(totals.waterCurrent)}
              </td>

              {/* صافي فرق الماء */}
              <td className="p-3 border-r border-slate-700 align-middle">
                <div
                  className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs font-bold border ${
                    totals.waterDiff < 0
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                      : totals.waterDiff > 0
                      ? 'bg-rose-950/80 text-rose-300 border-rose-600'
                      : 'bg-slate-800 text-slate-300 border-slate-600'
                  }`}
                >
                  <span>{totals.waterDiff > 0 ? '+' : ''}{formatNumber(totals.waterDiff)}</span>
                  {totals.waterPercent !== null && (
                    <span className="text-[10px]">
                      ({totals.waterPercent > 0 ? '+' : ''}{totals.waterPercent.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </td>

              {/* مجموع كهرباء أساس */}
              <td className="p-3 border-r border-slate-700 font-mono font-bold text-amber-200">
                {formatNumber(totals.electricityBase)}
              </td>

              {/* مجموع كهرباء حالي */}
              <td className="p-3 border-r border-slate-700 font-mono font-bold text-amber-100">
                {formatNumber(totals.electricityCurrent)}
              </td>

              {/* صافي فرق الكهرباء */}
              <td className="p-3 border-r border-slate-700 align-middle">
                <div
                  className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs font-bold border ${
                    totals.electricityDiff < 0
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                      : totals.electricityDiff > 0
                      ? 'bg-rose-950/80 text-rose-300 border-rose-600'
                      : 'bg-slate-800 text-slate-300 border-slate-600'
                  }`}
                >
                  <span>{totals.electricityDiff > 0 ? '+' : ''}{formatNumber(totals.electricityDiff)}</span>
                  {totals.electricityPercent !== null && (
                    <span className="text-[10px]">
                      ({totals.electricityPercent > 0 ? '+' : ''}{totals.electricityPercent.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </td>

              {/* Action column footer */}
              <td className="p-3 border-r border-slate-700 print:hidden text-center text-slate-400 text-xs">
                —
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Official Footnote for Report / Screen */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">إدارة الخدمات العامة – قسم إدارة المرافق</span>
          <span>•</span>
          <span>نظام قياس وتحليل استهلاك الطاقة والمياه</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 sm:mt-0">
          * يتم تحديث الفروقات والنسب المئوية تلقائياً بمجرد إدخال أو تعديل القيم.
        </div>
      </div>
    </div>
  );
};
