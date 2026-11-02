import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnnualSite, AnnualConsumptionRecord, AuditLogEntry } from '../../types.ts';
import {
  ANNUAL_STORAGE_KEYS,
  DEFAULT_ANNUAL_SITES,
  DEFAULT_CONSUMPTION_RECORDS,
  INITIAL_AUDIT_LOGS,
  calculateDiff,
  roundTo,
} from './annualHelpers.ts';
import { AnnualTable } from './AnnualTable.tsx';
import { AnnualKPIs } from './AnnualKPIs.tsx';
import { SiteManagementModal } from './SiteManagementModal.tsx';
import { MonthlyBreakdownModal } from './MonthlyBreakdownModal.tsx';
import { AuditLogModal } from './AuditLogModal.tsx';
import { exportAnnualConsumptionToExcel } from './excelExport.ts';
import {
  Building2,
  Calendar,
  Save,
  Download,
  Printer,
  History,
  Plus,
  Check,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';

interface AnnualConsumptionSystemProps {
  onBackToMonthly?: () => void;
}

export const AnnualConsumptionSystem: React.FC<AnnualConsumptionSystemProps> = ({
  onBackToMonthly,
}) => {
  // --- States ---
  const [baseYear, setBaseYear] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(ANNUAL_STORAGE_KEYS.SELECTED_BASE_YEAR);
      return saved ? Number(saved) : 2025;
    } catch {
      return 2025;
    }
  });

  const [currentYear, setCurrentYear] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(ANNUAL_STORAGE_KEYS.SELECTED_CURRENT_YEAR);
      return saved ? Number(saved) : 2026;
    } catch {
      return 2026;
    }
  });

  const [sites, setSites] = useState<AnnualSite[]>(() => {
    try {
      const saved = localStorage.getItem(ANNUAL_STORAGE_KEYS.SITES);
      return saved ? JSON.parse(saved) : DEFAULT_ANNUAL_SITES;
    } catch {
      return DEFAULT_ANNUAL_SITES;
    }
  });

  const [records, setRecords] = useState<Record<string, Record<number, AnnualConsumptionRecord>>>(() => {
    try {
      const saved = localStorage.getItem(ANNUAL_STORAGE_KEYS.RECORDS);
      return saved ? JSON.parse(saved) : DEFAULT_CONSUMPTION_RECORDS;
    } catch {
      return DEFAULT_CONSUMPTION_RECORDS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(ANNUAL_STORAGE_KEYS.AUDIT);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Modals state
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [monthlyModalTarget, setMonthlyModalTarget] = useState<{
    site: AnnualSite;
    year: number;
  } | null>(null);

  // Available selectable years
  const availableYears = useMemo(() => {
    const list = [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
    return Array.from(new Set([...list, baseYear, currentYear])).sort((a, b) => a - b);
  }, [baseYear, currentYear]);

  // Safe localStorage persistence helper
  const persistState = useCallback(
    (
      newSites: AnnualSite[],
      newRecords: Record<string, Record<number, AnnualConsumptionRecord>>,
      newAudit: AuditLogEntry[],
      newBaseY?: number,
      newCurY?: number
    ) => {
      try {
        localStorage.setItem(ANNUAL_STORAGE_KEYS.SITES, JSON.stringify(newSites));
        localStorage.setItem(ANNUAL_STORAGE_KEYS.RECORDS, JSON.stringify(newRecords));
        localStorage.setItem(ANNUAL_STORAGE_KEYS.AUDIT, JSON.stringify(newAudit));
        if (newBaseY) localStorage.setItem(ANNUAL_STORAGE_KEYS.SELECTED_BASE_YEAR, String(newBaseY));
        if (newCurY) localStorage.setItem(ANNUAL_STORAGE_KEYS.SELECTED_CURRENT_YEAR, String(newCurY));
      } catch (e) {
        console.warn('LocalStorage save warning in AnnualConsumptionSystem', e);
      }
    },
    []
  );

  // Auto-sync on changes
  useEffect(() => {
    persistState(sites, records, auditLogs, baseYear, currentYear);
  }, [sites, records, auditLogs, baseYear, currentYear, persistState]);

  // Helper to add audit log
  const addAuditLog = useCallback((action: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      user: 'إدارة المرافق',
      action,
      details,
    };
    setAuditLogs((prev) => [newEntry, ...prev.slice(0, 199)]);
  }, []);

  // --- Handlers ---
  const handleBaseYearChange = (year: number) => {
    if (year === currentYear) {
      alert('يرجى اختيار سنة مقارنة مختلفة عن السنة الحالية.');
      return;
    }
    setBaseYear(year);
    addAuditLog('تغيير سنة المقارنة', `تم تحديد سنة الأساس إلى ${year}`);
  };

  const handleCurrentYearChange = (year: number) => {
    if (year === baseYear) {
      alert('يرجى اختيار سنة حالية مختلفة عن سنة المقارنة.');
      return;
    }
    setCurrentYear(year);
    addAuditLog('تغيير السنة الحالية', `تم تحديد السنة الحالية إلى ${year}`);
  };

  // Add a new site
  const handleAddSite = (newSiteData: Omit<AnnualSite, 'id' | 'createdAt'>) => {
    const newSite: AnnualSite = {
      ...newSiteData,
      id: `site_ann_${Date.now()}`,
      createdAt: new Date().toISOString(),
      order: sites.length + 1,
    };
    const nextSites = [...sites, newSite];
    setSites(nextSites);
    addAuditLog('إضافة مقر جديد', `تمت إضافة مقر "${newSite.name}" (${newSite.code || 'بدون رمز'})`);
  };

  // Update site metadata
  const handleUpdateSite = (id: string, updates: Partial<AnnualSite>) => {
    const target = sites.find((s) => s.id === id);
    const nextSites = sites.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setSites(nextSites);
    addAuditLog(
      'تعديل بيانات مقر',
      `تم تحديث بيانات مقر "${target?.name || id}" إلى "${updates.name || target?.name}"`
    );
  };

  // Archive site
  const handleArchiveSite = (id: string) => {
    const target = sites.find((s) => s.id === id);
    const nextSites = sites.map((s) => (s.id === id ? { ...s, archived: true } : s));
    setSites(nextSites);
    addAuditLog('أرشفة مقر', `تم نقل مقر "${target?.name || id}" إلى الأرشيف مع الاحتفاظ بكافة سجلاته`);
  };

  // Restore site
  const handleRestoreSite = (id: string) => {
    const target = sites.find((s) => s.id === id);
    const nextSites = sites.map((s) => (s.id === id ? { ...s, archived: false } : s));
    setSites(nextSites);
    addAuditLog('استعادة مقر', `تمت استعادة مقر "${target?.name || id}" من الأرشيف إلى قائمة المقرات النشطة`);
  };

  // Permanently delete site
  const handleDeleteSitePermanently = (id: string) => {
    const target = sites.find((s) => s.id === id);
    const nextSites = sites.filter((s) => s.id !== id);
    setSites(nextSites);

    // Also remove consumption records
    const nextRecords = { ...records };
    delete nextRecords[id];
    setRecords(nextRecords);

    addAuditLog('حذف مقر نهائياً', `تم حذف مقر "${target?.name || id}" وسجلاته نهائياً من قاعدة البيانات`);
  };

  // Inline update of consumption field
  const handleUpdateConsumption = (
    siteId: string,
    year: number,
    field: 'water' | 'electricity',
    value: number | null
  ) => {
    const site = sites.find((s) => s.id === siteId);
    setRecords((prev) => {
      const siteRecords = prev[siteId] ? { ...prev[siteId] } : {};
      const yearRecord: AnnualConsumptionRecord = siteRecords[year]
        ? { ...siteRecords[year] }
        : { water: null, electricity: null };

      yearRecord[field] = value;
      yearRecord.updatedAt = new Date().toISOString();
      siteRecords[year] = yearRecord;

      return {
        ...prev,
        [siteId]: siteRecords,
      };
    });

    const fieldLabel = field === 'water' ? 'مياه (م³)' : 'كهرباء (ك.و)';
    addAuditLog(
      'تعديل استهلاك مباشر',
      `تعديل استهلاك ${fieldLabel} لمقر "${site?.name || siteId}" لسنة ${year} إلى ${
        value !== null ? value : 'غير مدخل'
      }`
    );
  };

  // Save full record from monthly modal
  const handleSaveMonthlyRecord = (
    siteId: string,
    year: number,
    updatedRecord: AnnualConsumptionRecord
  ) => {
    const site = sites.find((s) => s.id === siteId);
    setRecords((prev) => {
      const siteRecords = prev[siteId] ? { ...prev[siteId] } : {};
      siteRecords[year] = updatedRecord;
      return {
        ...prev,
        [siteId]: siteRecords,
      };
    });

    addAuditLog(
      'تحديث الاستهلاك الشهري',
      `حفظ الاستهلاك الشهري والتفصيلي لمقر "${site?.name || siteId}" لسنة ${year}`
    );
  };

  // Open monthly breakdown modal
  const handleOpenMonthlyModal = (site: AnnualSite, year: number) => {
    setMonthlyModalTarget({ site, year });
    setIsMonthlyModalOpen(true);
  };

  // Manual save trigger for feedback
  const handleManualSave = () => {
    persistState(sites, records, auditLogs, baseYear, currentYear);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
    addAuditLog('حفظ يدوي', 'تم تأكيد وحفظ كافة السجلات والمقرات يدوياً بنجاح');
  };

  // Reset to default factory template if requested
  const handleResetToDefaults = () => {
    if (
      window.confirm(
        'تحذير: هل ترغب في إعادة ضبط نظام فرق الاستهلاك إلى البيانات الافتراضية الأصلية؟'
      )
    ) {
      setSites(DEFAULT_ANNUAL_SITES);
      setRecords(DEFAULT_CONSUMPTION_RECORDS);
      setBaseYear(2025);
      setCurrentYear(2026);
      addAuditLog('إعادة ضبط المصنع', 'تم استرجاع المقرات والبيانات الافتراضية للنظام');
    }
  };

  // --- Totals Calculation ---
  const activeSites = useMemo(() => sites.filter((s) => !s.archived), [sites]);

  const totals = useMemo(() => {
    let waterBase = 0;
    let waterCurrent = 0;
    let electricityBase = 0;
    let electricityCurrent = 0;

    activeSites.forEach((site) => {
      const bRec = records[site.id]?.[baseYear];
      const cRec = records[site.id]?.[currentYear];

      if (bRec?.water !== null && bRec?.water !== undefined) {
        waterBase += bRec.water;
      }
      if (cRec?.water !== null && cRec?.water !== undefined) {
        waterCurrent += cRec.water;
      }
      if (bRec?.electricity !== null && bRec?.electricity !== undefined) {
        electricityBase += bRec.electricity;
      }
      if (cRec?.electricity !== null && cRec?.electricity !== undefined) {
        electricityCurrent += cRec.electricity;
      }
    });

    waterBase = roundTo(waterBase);
    waterCurrent = roundTo(waterCurrent);
    electricityBase = roundTo(electricityBase);
    electricityCurrent = roundTo(electricityCurrent);

    const wDiffObj = calculateDiff(waterCurrent, waterBase);
    const eDiffObj = calculateDiff(electricityCurrent, electricityBase);

    return {
      waterBase,
      waterCurrent,
      waterDiff: wDiffObj.diff ?? 0,
      waterPercent: wDiffObj.percent,
      electricityBase,
      electricityCurrent,
      electricityDiff: eDiffObj.diff ?? 0,
      electricityPercent: eDiffObj.percent,
    };
  }, [activeSites, records, baseYear, currentYear]);

  // Export to Excel
  const handleExportExcel = () => {
    const success = exportAnnualConsumptionToExcel({
      baseYear,
      currentYear,
      sites: activeSites,
      records,
      totals,
    });
    if (success) {
      addAuditLog('تصدير Excel', `تصدير تقرير فرق الاستهلاك لسنتي (${baseYear} - ${currentYear}) بصيغة Excel`);
    }
  };

  // Print Report
  const handlePrint = () => {
    window.print();
    addAuditLog('طباعة التقرير', `طباعة تقرير فرق الاستهلاك السنوي لسنتي (${baseYear} - ${currentYear})`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner (Dark Petrol with Gold Bottom Border) Matching Exact Reference */}
      <div className="bg-[#091526] p-4 sm:p-5 rounded-xl border-b-4 border-yellow-500 shadow-md text-white relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Title & Subtitle */}
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2 text-yellow-400 text-xs font-bold mb-1">
              <Sparkles size={14} />
              <span>إدارة الخدمات العامة / قسم إدارة المرافق</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white">
              فرق الاستهلاك السنوي
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              مقارنة استهلاك المياه (م³) والكهرباء (ك.و) بين سنة المقارنة ({baseYear}) والسنة الحالية ({currentYear})
            </p>
          </div>

          {/* Controls: Year Selectors & Main Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 print:hidden">
            {/* Base Year Selector */}
            <div className="flex items-center bg-blue-950/70 border border-blue-800/80 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-blue-300 ml-1.5 font-medium">سنة الأساس:</span>
              <select
                value={baseYear}
                onChange={(e) => handleBaseYearChange(Number(e.target.value))}
                className="bg-transparent text-yellow-400 font-bold font-mono outline-none cursor-pointer [&>option]:text-slate-900"
              >
                {availableYears.map((y) => (
                  <option key={`base-${y}`} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Year Selector */}
            <div className="flex items-center bg-blue-950/70 border border-blue-800/80 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-blue-300 ml-1.5 font-medium">السنة الحالية:</span>
              <select
                value={currentYear}
                onChange={(e) => handleCurrentYearChange(Number(e.target.value))}
                className="bg-transparent text-emerald-400 font-bold font-mono outline-none cursor-pointer [&>option]:text-slate-900"
              >
                {availableYears.map((y) => (
                  <option key={`cur-${y}`} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Manage Sites Button */}
            <button
              type="button"
              onClick={() => setIsSiteModalOpen(true)}
              className="bg-blue-800 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg border border-blue-700 text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="إدارة وإضافة وتعديل المقرات"
            >
              <Building2 size={15} className="text-yellow-400" />
              <span>إدارة المقرات</span>
              <span className="bg-blue-950 text-[10px] px-1.5 py-0.2 rounded-full font-mono text-yellow-300">
                {activeSites.length}
              </span>
            </button>

            {/* Export Excel Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg border border-emerald-700 text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="تصدير جدول الفرق إلى Excel"
            >
              <Download size={15} />
              <span>تصدير Excel</span>
            </button>

            {/* Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-blue-900 hover:bg-blue-800 text-blue-100 px-3 py-1.5 rounded-lg border border-blue-700 text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="طباعة تقرير A4 أفقي أو حفظ PDF"
            >
              <Printer size={15} />
              <span>طباعة / PDF</span>
            </button>

            {/* Audit Log Button */}
            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              className="bg-blue-950 hover:bg-blue-900 text-blue-200 px-2.5 py-1.5 rounded-lg border border-blue-800 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
              title="عرض سجل تدقيق العمليات"
            >
              <History size={15} />
              <span className="hidden sm:inline">سجل العمليات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Sub-Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 print:hidden">
        <div className="flex items-center gap-2">
          {/* Save Button */}
          <button
            type="button"
            onClick={handleManualSave}
            className="flex items-center gap-1.5 bg-[#091526] hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm border border-blue-900 transition cursor-pointer"
          >
            {saveStatus === 'saved' ? (
              <>
                <Check size={15} className="text-emerald-400" />
                <span className="text-emerald-400">تم الحفظ تلقائياً ومحلياً</span>
              </>
            ) : (
              <>
                <Save size={15} className="text-yellow-400" />
                <span>حفظ التعديلات</span>
              </>
            )}
          </button>

          {/* Quick Add Site Trigger */}
          <button
            type="button"
            onClick={() => setIsSiteModalOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm border border-slate-300 transition cursor-pointer"
          >
            <Plus size={15} className="text-blue-600" />
            <span>إضافة مقر جديد</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="text-slate-400 hover:text-slate-600 underline text-[11px] transition"
            title="استرجاع البيانات الافتراضية"
          >
            استرجاع النماذج الافتراضية
          </button>

          {onBackToMonthly && (
            <button
              type="button"
              onClick={onBackToMonthly}
              className="text-blue-600 hover:text-blue-800 font-bold underline transition"
            >
              العودة إلى جدول الاستهلاك الشهري ←
            </button>
          )}
        </div>
      </div>

      {/* KPIs & Analytics Dashboard */}
      <AnnualKPIs
        baseYear={baseYear}
        currentYear={currentYear}
        sites={sites}
        records={records}
        totals={totals}
      />

      {/* Main Table: "فرق الاستهلاك السنوي" */}
      <AnnualTable
        baseYear={baseYear}
        currentYear={currentYear}
        sites={sites}
        records={records}
        onUpdateConsumption={handleUpdateConsumption}
        onOpenMonthlyModal={handleOpenMonthlyModal}
        totals={totals}
      />

      {/* Modals */}
      <SiteManagementModal
        isOpen={isSiteModalOpen}
        onClose={() => setIsSiteModalOpen(false)}
        sites={sites}
        onAddSite={handleAddSite}
        onUpdateSite={handleUpdateSite}
        onArchiveSite={handleArchiveSite}
        onRestoreSite={handleRestoreSite}
        onDeleteSitePermanently={handleDeleteSitePermanently}
      />

      <MonthlyBreakdownModal
        isOpen={isMonthlyModalOpen}
        onClose={() => setIsMonthlyModalOpen(false)}
        site={monthlyModalTarget?.site || null}
        year={monthlyModalTarget?.year || currentYear}
        record={
          monthlyModalTarget
            ? records[monthlyModalTarget.site.id]?.[monthlyModalTarget.year]
            : undefined
        }
        onSaveMonthlyRecord={handleSaveMonthlyRecord}
      />

      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={auditLogs}
        onClearLogs={() => setAuditLogs([])}
      />
    </div>
  );
};
