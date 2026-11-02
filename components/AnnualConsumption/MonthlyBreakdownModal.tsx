import React, { useState, useEffect } from 'react';
import { MONTHS, MonthKey, AnnualConsumptionRecord, AnnualSite } from '../../types.ts';
import { X, Calendar, Droplets, Zap, CheckCircle2, AlertCircle, Save, Check } from 'lucide-react';
import { roundTo, formatNumber, getMonthlySum } from './annualHelpers.ts';

interface MonthlyBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: AnnualSite | null;
  year: number;
  record: AnnualConsumptionRecord | undefined;
  onSaveMonthlyRecord: (
    siteId: string,
    year: number,
    updatedRecord: AnnualConsumptionRecord
  ) => void;
}

export const MonthlyBreakdownModal: React.FC<MonthlyBreakdownModalProps> = ({
  isOpen,
  onClose,
  site,
  year,
  record,
  onSaveMonthlyRecord,
}) => {
  const [waterMonths, setWaterMonths] = useState<Partial<Record<MonthKey, number | null>>>({});
  const [electricityMonths, setElectricityMonths] = useState<Partial<Record<MonthKey, number | null>>>({});
  const [useMonthlyWaterSum, setUseMonthlyWaterSum] = useState(false);
  const [useMonthlyElectricitySum, setUseMonthlyElectricitySum] = useState(false);
  const [directWater, setDirectWater] = useState<string>('');
  const [directElectricity, setDirectElectricity] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (record) {
      setWaterMonths(record.monthlyWater || {});
      setElectricityMonths(record.monthlyElectricity || {});
      setUseMonthlyWaterSum(!!record.useMonthlyWaterSum);
      setUseMonthlyElectricitySum(!!record.useMonthlyElectricitySum);
      setDirectWater(record.water !== null && record.water !== undefined ? String(record.water) : '');
      setDirectElectricity(record.electricity !== null && record.electricity !== undefined ? String(record.electricity) : '');
      setNotes(record.notes || '');
    } else {
      setWaterMonths({});
      setElectricityMonths({});
      setUseMonthlyWaterSum(false);
      setUseMonthlyElectricitySum(false);
      setDirectWater('');
      setDirectElectricity('');
      setNotes('');
    }
    setSavedSuccess(false);
  }, [record, site, year, isOpen]);

  if (!isOpen || !site) return null;

  const waterSumResult = getMonthlySum(waterMonths);
  const elecSumResult = getMonthlySum(electricityMonths);

  const waterComplete = waterSumResult.count === 12;
  const elecComplete = elecSumResult.count === 12;

  const handleWaterMonthChange = (key: MonthKey, valStr: string) => {
    const val = valStr === '' ? null : parseFloat(valStr);
    setWaterMonths((prev) => ({
      ...prev,
      [key]: val !== null && !isNaN(val) ? Math.max(0, val) : null,
    }));
  };

  const handleElecMonthChange = (key: MonthKey, valStr: string) => {
    const val = valStr === '' ? null : parseFloat(valStr);
    setElectricityMonths((prev) => ({
      ...prev,
      [key]: val !== null && !isNaN(val) ? Math.max(0, val) : null,
    }));
  };

  const handleSave = () => {
    let finalWater: number | null = null;
    if (useMonthlyWaterSum) {
      finalWater = waterSumResult.count > 0 ? waterSumResult.total : null;
    } else if (directWater.trim() !== '') {
      const parsed = parseFloat(directWater);
      finalWater = !isNaN(parsed) ? roundTo(parsed) : null;
    }

    let finalElec: number | null = null;
    if (useMonthlyElectricitySum) {
      finalElec = elecSumResult.count > 0 ? elecSumResult.total : null;
    } else if (directElectricity.trim() !== '') {
      const parsed = parseFloat(directElectricity);
      finalElec = !isNaN(parsed) ? roundTo(parsed) : null;
    }

    const updated: AnnualConsumptionRecord = {
      water: finalWater,
      electricity: finalElec,
      monthlyWater: waterMonths,
      monthlyElectricity: electricityMonths,
      useMonthlyWaterSum,
      useMonthlyElectricitySum,
      notes,
      updatedAt: new Date().toISOString(),
    };

    onSaveMonthlyRecord(site.id, year, updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#091526] text-white px-6 py-4 flex items-center justify-between border-b-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 rounded-xl text-yellow-400 border border-blue-400/30">
              <Calendar size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                سجل الاستهلاك الشهري: {site.name} — سنة {year}
              </h2>
              <p className="text-xs text-blue-200">
                تسجيل شهري دقيق للماء والكهرباء مع احتساب الإجمالي ومتابعة اكتمال البيانات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Banners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Water Completeness Card */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                waterComplete
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <Droplets size={22} />
                </div>
                <div>
                  <div className="font-bold text-xs">استهلاك المياه (متر مكعب)</div>
                  <div className="text-xs opacity-80 mt-0.5">
                    الشهور المسجلة: <strong>{waterSumResult.count} من 12 شهر</strong>
                  </div>
                </div>
              </div>
              <div className="text-left font-mono">
                <div className="text-sm font-bold">{formatNumber(waterSumResult.total)} م³</div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-bold ${
                    waterComplete ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                  }`}
                >
                  {waterComplete ? 'مكتمل كلياً' : 'غير مكتمل'}
                </span>
              </div>
            </div>

            {/* Electricity Completeness Card */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                elecComplete
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Zap size={22} />
                </div>
                <div>
                  <div className="font-bold text-xs">استهلاك الكهرباء (كيلو واط)</div>
                  <div className="text-xs opacity-80 mt-0.5">
                    الشهور المسجلة: <strong>{elecSumResult.count} من 12 شهر</strong>
                  </div>
                </div>
              </div>
              <div className="text-left font-mono">
                <div className="text-sm font-bold">{formatNumber(elecSumResult.total)} ك.و</div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-bold ${
                    elecComplete ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                  }`}
                >
                  {elecComplete ? 'مكتمل كلياً' : 'غير مكتمل'}
                </span>
              </div>
            </div>
          </div>

          {/* Sync Options */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">طريقة احتساب الإجمالي السنوي في جدول الفرق</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useMonthlyWaterSum}
                  onChange={(e) => setUseMonthlyWaterSum(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    اعتماد مجموع الأشهر لإجمالي المياه ({formatNumber(waterSumResult.total)} م³)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    إذا تم تفعيله، سيتم تحديث خانة مياه {year} تلقائياً من مجموع الأشهر
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useMonthlyElectricitySum}
                  onChange={(e) => setUseMonthlyElectricitySum(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    اعتماد مجموع الأشهر لإجمالي الكهرباء ({formatNumber(elecSumResult.total)} ك.و)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    إذا تم تفعيله، سيتم تحديث خانة كهرباء {year} تلقائياً من مجموع الأشهر
                  </span>
                </div>
              </label>
            </div>

            {/* Direct Inputs if not using monthly sums */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الإدخال المباشر لإجمالي المياه ({year})
                </label>
                <input
                  type="number"
                  disabled={useMonthlyWaterSum}
                  value={directWater}
                  onChange={(e) => setDirectWater(e.target.value)}
                  placeholder={useMonthlyWaterSum ? 'محتسب من الأشهر' : 'أدخل الإجمالي السنوي مباشرة (م³)'}
                  className={`w-full text-xs p-2 rounded-lg border outline-none font-mono ${
                    useMonthlyWaterSum
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الإدخال المباشر لإجمالي الكهرباء ({year})
                </label>
                <input
                  type="number"
                  disabled={useMonthlyElectricitySum}
                  value={directElectricity}
                  onChange={(e) => setDirectElectricity(e.target.value)}
                  placeholder={useMonthlyElectricitySum ? 'محتسب من الأشهر' : 'أدخل الإجمالي السنوي مباشرة (ك.و)'}
                  className={`w-full text-xs p-2 rounded-lg border outline-none font-mono ${
                    useMonthlyElectricitySum
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:ring-2 focus:ring-amber-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 12-Month Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-700 flex justify-between items-center border-b border-slate-200">
              <span>جدول الإدخال الشهري التفصيلي</span>
              <span className="text-[11px] text-slate-500 font-normal">يمكن ترك الشهر فارغاً إذا لم تتوفر فواتير بعد</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                    <th className="p-2.5 border-r border-slate-200 w-28 text-right pr-4">الخدمة / الشهر</th>
                    {MONTHS.map((m) => (
                      <th key={m.key} className="p-2 border-r border-slate-200 min-w-[70px]">
                        {m.label}
                      </th>
                    ))}
                    <th className="p-2 bg-slate-200 text-slate-900 font-bold min-w-[90px]">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Water Row */}
                  <tr className="border-b border-slate-100 hover:bg-blue-50/40">
                    <td className="p-2.5 border-r border-slate-200 font-bold text-right pr-4 text-blue-900 bg-blue-50/50">
                      <div className="flex items-center gap-1.5">
                        <Droplets size={14} className="text-blue-600" />
                        <span>الماء (م³)</span>
                      </div>
                    </td>
                    {MONTHS.map((m) => {
                      const val = waterMonths[m.key];
                      return (
                        <td key={m.key} className="p-1 border-r border-slate-200">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={val !== null && val !== undefined ? val : ''}
                            onChange={(e) => handleWaterMonthChange(m.key, e.target.value)}
                            placeholder="—"
                            className="w-full text-center p-1.5 rounded border border-transparent hover:border-blue-300 focus:border-blue-500 focus:bg-white bg-transparent outline-none font-mono text-xs"
                          />
                        </td>
                      );
                    })}
                    <td className="p-2 font-bold font-mono text-blue-900 bg-blue-100/60">
                      {formatNumber(waterSumResult.total)}
                    </td>
                  </tr>

                  {/* Electricity Row */}
                  <tr className="border-b border-slate-100 hover:bg-amber-50/40">
                    <td className="p-2.5 border-r border-slate-200 font-bold text-right pr-4 text-amber-900 bg-amber-50/50">
                      <div className="flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-600" />
                        <span>الكهرباء (ك.و)</span>
                      </div>
                    </td>
                    {MONTHS.map((m) => {
                      const val = electricityMonths[m.key];
                      return (
                        <td key={m.key} className="p-1 border-r border-slate-200">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={val !== null && val !== undefined ? val : ''}
                            onChange={(e) => handleElecMonthChange(m.key, e.target.value)}
                            placeholder="—"
                            className="w-full text-center p-1.5 rounded border border-transparent hover:border-amber-300 focus:border-amber-500 focus:bg-white bg-transparent outline-none font-mono text-xs"
                          />
                        </td>
                      );
                    })}
                    <td className="p-2 font-bold font-mono text-amber-900 bg-amber-100/60">
                      {formatNumber(elecSumResult.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات إضافية على الاستهلاك السنوي</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات تتعلق بأسباب تغير الاستهلاك، أعمال الصيانة، أو تسريبات المياه..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <Check size={14} /> تم الحفظ بنجاح
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-4 py-2 rounded-lg transition"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2 rounded-lg shadow-sm flex items-center gap-2 transition"
            >
              <Save size={15} />
              حفظ التعديلات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
