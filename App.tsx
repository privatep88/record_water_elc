import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header.tsx';
import HeroBanner from './components/HeroBanner.tsx';
import MonthlyKpiCards from './components/MonthlyKpiCards.tsx';
import Footer from './components/Footer.tsx';
import ConsumptionTable from './components/ConsumptionTable.tsx';
import { AnnualConsumptionSystem } from './components/AnnualConsumption/AnnualConsumptionSystem.tsx';
import { REVERSE_LEGACY_SITE_ID_MAP } from './components/AnnualConsumption/annualHelpers.ts';
import { INITIAL_SITES } from './constants.ts';
import { SiteData, AnnualSite, RowType, MONTHS, MonthKey } from './types.ts';
import { BarChart3, TableProperties } from 'lucide-react';

// Storage Keys
const STORAGE_KEYS = {
  DATA: 'saher_dashboard_data',
  TEMPLATE: 'saher_dashboard_template',
  ARCHIVES: 'saher_dashboard_archives',
};

// Helper function to deep clone the initial data so we don't modify the constant
const getInitialData = (): SiteData[] => {
  return JSON.parse(JSON.stringify(INITIAL_SITES));
};

function App() {
  // Navigation View Tab: 'monthly' or 'annual_diff' (Default: جدول الاستهلاك الشهري)
  const [activeView, setActiveView] = useState<'annual_diff' | 'monthly'>('monthly');

  // Set default year to current year dynamically
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<number | null>(null);
  const isMounted = useRef(false);

  // Update document title when year changes
  useEffect(() => {
    document.title = `نسبة استهلاك الماء والكهرباء - ساهر - ${currentYear}`;
  }, [currentYear]);

  // State initialization with LocalStorage
  const [templateSites, setTemplateSites] = useState<SiteData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATE);
      return saved ? JSON.parse(saved) : getInitialData();
    } catch (e) {
      console.warn('Error reading template from storage', e);
      return getInitialData();
    }
  });

  const [dataByYear, setDataByYear] = useState<Record<number, SiteData[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DATA);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.warn('Error reading data from storage', e);
      return {};
    }
  });

  const [archivesByYear, setArchivesByYear] = useState<Record<number, SiteData[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARCHIVES);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Safe Save Function to handle QuotaExceededError
  const saveData = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        try {
          alert('تنبيه: ذاكرة المتصفح ممتلئة. قد لا يتم حفظ التعديلات الأخيرة أو المرفقات الكبيرة.');
        } catch {
          console.warn('Storage quota exceeded: Browser alert not permitted');
        }
      } else {
        console.error(`Failed to save ${key}`, e);
      }
    }
  }, []);

  // Auto-save Effect
  useEffect(() => {
    if (isMounted.current) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setAutoSaveStatus('saving');

      saveTimeoutRef.current = window.setTimeout(() => {
        saveData(STORAGE_KEYS.DATA, dataByYear);
        saveData(STORAGE_KEYS.TEMPLATE, templateSites);
        saveData(STORAGE_KEYS.ARCHIVES, archivesByYear);
        setAutoSaveStatus('saved');

        saveTimeoutRef.current = window.setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 1500);
      }, 1000);
    } else {
      isMounted.current = true;
      saveData(STORAGE_KEYS.DATA, dataByYear);
      saveData(STORAGE_KEYS.TEMPLATE, templateSites);
      saveData(STORAGE_KEYS.ARCHIVES, archivesByYear);
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [dataByYear, templateSites, archivesByYear, saveData]);

  // Manual Save Handler
  const handleManualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveData(STORAGE_KEYS.DATA, dataByYear);
    saveData(STORAGE_KEYS.TEMPLATE, templateSites);
    saveData(STORAGE_KEYS.ARCHIVES, archivesByYear);

    setAutoSaveStatus('saved');
    saveTimeoutRef.current = window.setTimeout(() => {
      setAutoSaveStatus('idle');
    }, 1500);
  }, [dataByYear, templateSites, archivesByYear, saveData]);

  // Get the data for the currently selected year.
  const currentSitesData = useMemo(() => {
    let data: SiteData[] = [];
    if (dataByYear[currentYear]) {
      data = dataByYear[currentYear];
    } else {
      data = JSON.parse(JSON.stringify(templateSites));
    }

    return data.filter((site) => !site.startYear || site.startYear <= currentYear);
  }, [currentYear, dataByYear, templateSites]);

  // Get previous year data for KPI comparison
  const previousYearSitesData = useMemo(() => {
    const prevYear = currentYear - 1;
    if (dataByYear[prevYear]) {
      return dataByYear[prevYear].filter((site) => !site.startYear || site.startYear <= prevYear);
    }
    return [];
  }, [currentYear, dataByYear]);

  // Get the archived data for the currently selected year
  const currentArchivedData = useMemo(() => {
    return archivesByYear[currentYear] || [];
  }, [currentYear, archivesByYear]);

  // Handle value updates from the table (local to the current year)
  const handleDataChange = (newData: SiteData[]) => {
    setDataByYear((prev) => ({
      ...prev,
      [currentYear]: newData,
    }));
  };

  // Handle global site addition (updates ALL years and the template)
  const handleGlobalAddSite = (newSite: SiteData) => {
    setTemplateSites((prev) => [...prev, JSON.parse(JSON.stringify(newSite))]);

    setDataByYear((prev) => {
      const updatedDataByYear = { ...prev };

      const appendSiteToYear = (y: number) => {
        if (updatedDataByYear[y]) {
          const exists = updatedDataByYear[y].some((s) => s.id === newSite.id);
          if (!exists) {
            updatedDataByYear[y] = [...updatedDataByYear[y], JSON.parse(JSON.stringify(newSite))];
          }
        }
      };

      if (!updatedDataByYear[currentYear]) {
        updatedDataByYear[currentYear] = [...templateSites, JSON.parse(JSON.stringify(newSite))];
      } else {
        appendSiteToYear(currentYear);
      }

      Object.keys(updatedDataByYear).forEach((key) => {
        const yearKey = Number(key);
        if (yearKey > currentYear) {
          appendSiteToYear(yearKey);
        }
      });

      return updatedDataByYear;
    });
  };

  // Handle updates to site metadata
  const handleSiteMetadataUpdate = (siteId: string, updates: Partial<SiteData>) => {
    const updateList = (list: SiteData[]) =>
      list.map((s) => {
        if (s.id === siteId) {
          return { ...s, ...updates };
        }
        return s;
      });

    setTemplateSites((prev) => updateList(prev));

    setDataByYear((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        const year = Number(key);
        next[year] = updateList(next[year]);
      });
      return next;
    });

    setArchivesByYear((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        const year = Number(key);
        next[year] = updateList(next[year]);
      });
      return next;
    });
  };

  const handleArchiveSite = (siteId: string) => {
    const siteToArchive = currentSitesData.find((s) => s.id === siteId);
    if (!siteToArchive) return;

    const newActiveData = currentSitesData.filter((s) => s.id !== siteId);
    handleDataChange(newActiveData);

    setArchivesByYear((prev) => ({
      ...prev,
      [currentYear]: [...(prev[currentYear] || []), siteToArchive],
    }));
  };

  const handleRestoreSite = (siteId: string) => {
    const siteToRestore = currentArchivedData.find((s) => s.id === siteId);
    if (!siteToRestore) return;

    setArchivesByYear((prev) => ({
      ...prev,
      [currentYear]: prev[currentYear].filter((s) => s.id !== siteId),
    }));

    handleDataChange([...currentSitesData, siteToRestore]);
  };

  const handleDeletePermanently = (siteId: string) => {
    setArchivesByYear((prev) => ({
      ...prev,
      [currentYear]: prev[currentYear].filter((s) => s.id !== siteId),
    }));
  };

  // Helper to resolve a Monthly Consumption site ID from an Annual Consumption site ID or meterNumber
  const resolveMonthlySiteId = useCallback(
    (annualSiteId: string, meterNumber?: string, searchArchived = false): string | null => {
      const mappedId = REVERSE_LEGACY_SITE_ID_MAP[annualSiteId] || annualSiteId;
      const sourceList = searchArchived ? currentArchivedData : currentSitesData;
      const byId = sourceList.find((s) => s.id === mappedId || s.id === annualSiteId);
      if (byId) return byId.id;
      if (meterNumber && meterNumber.trim() !== '') {
        const byMeter = sourceList.find((s) => s.meterNumber.trim() === meterNumber.trim());
        if (byMeter) return byMeter.id;
      }
      return null;
    },
    [currentSitesData, currentArchivedData]
  );

  const handleSyncFromAnnualMetadata = useCallback(
    (
      annualSiteId: string,
      meterNumber: string | undefined,
      updates: { name?: string; meterNumber?: string }
    ) => {
      const targetId =
        resolveMonthlySiteId(annualSiteId, meterNumber, false) ||
        resolveMonthlySiteId(annualSiteId, meterNumber, true);
      if (targetId) {
        const cleanUpdates: Partial<SiteData> = {};
        if (updates.name !== undefined) cleanUpdates.name = updates.name;
        if (updates.meterNumber !== undefined) cleanUpdates.meterNumber = updates.meterNumber;
        handleSiteMetadataUpdate(targetId, cleanUpdates);
      }
    },
    [resolveMonthlySiteId]
  );

  const handleSyncFromAnnualAdd = useCallback(
    (annualSite: AnnualSite) => {
      const timestamp = Date.now();
      const createEmptyMonthValues = () => {
        const v: Record<string, number> = {};
        MONTHS.forEach((m) => (v[m.key] = 0));
        return v as Record<MonthKey, number>;
      };

      const newMonthlySite: SiteData = {
        id: annualSite.id,
        name: annualSite.name,
        meterNumber: annualSite.meterNumber || '',
        startYear: currentYear,
        rows: [
          {
            id: `s_${timestamp}_r1`,
            label: 'الماء ( متر مكعب)',
            unit: '',
            type: RowType.INPUT,
            isCost: false,
            values: createEmptyMonthValues(),
            attachments: [],
          },
          {
            id: `s_${timestamp}_r2`,
            label: 'قيمة الاستهلاك الماء',
            type: RowType.INPUT,
            isCost: true,
            values: createEmptyMonthValues(),
            attachments: [],
          },
          {
            id: `s_${timestamp}_r3`,
            label: 'الكهرباء ( كيلو واط )',
            unit: '',
            type: RowType.INPUT,
            isCost: false,
            values: createEmptyMonthValues(),
            attachments: [],
          },
          {
            id: `s_${timestamp}_r4`,
            label: 'قيمة الاستهلاك الكهرباء',
            type: RowType.INPUT,
            isCost: true,
            values: createEmptyMonthValues(),
            attachments: [],
          },
          {
            id: `s_${timestamp}_total`,
            label: 'إجمالي قيمة الاستهلاك',
            type: RowType.CALCULATED_TOTAL,
            isCost: false,
            values: createEmptyMonthValues(),
            attachments: [],
          },
        ],
      };

      handleGlobalAddSite(newMonthlySite);
    },
    [currentYear, templateSites]
  );

  const handleSyncFromAnnualArchive = useCallback(
    (annualSiteId: string, meterNumber?: string) => {
      const targetId = resolveMonthlySiteId(annualSiteId, meterNumber, false);
      if (targetId) {
        handleArchiveSite(targetId);
      }
    },
    [resolveMonthlySiteId, currentSitesData, currentYear]
  );

  const handleSyncFromAnnualRestore = useCallback(
    (annualSiteId: string, meterNumber?: string) => {
      const targetId = resolveMonthlySiteId(annualSiteId, meterNumber, true);
      if (targetId) {
        handleRestoreSite(targetId);
      }
    },
    [resolveMonthlySiteId, currentArchivedData, currentSitesData, currentYear]
  );

  const handleSyncFromAnnualDelete = useCallback(
    (annualSiteId: string, meterNumber?: string) => {
      const targetId = resolveMonthlySiteId(annualSiteId, meterNumber, true);
      if (targetId) {
        handleDeletePermanently(targetId);
      }
    },
    [resolveMonthlySiteId, currentYear]
  );

  return (
    <div id="top" className="flex flex-col min-h-screen bg-[#eef2f6] font-sans">
      {/* Top Corporate Header */}
      <Header
        currentYear={currentYear}
        onYearChange={setCurrentYear}
        autoSaveStatus={autoSaveStatus}
      />

      {/* Master Hero Banner */}
      <HeroBanner />

      {/* Main Content Container */}
      <main className="flex-grow w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-5">
        <div className="bg-[#f8fafc] rounded-2xl shadow-md border border-slate-200/90 p-3 sm:p-5 md:p-6 min-h-[500px]">
          {/* Navigation Tabs Row (Matching Reference Layout) */}
          <div className="flex flex-wrap items-center justify-start gap-2.5 sm:gap-3 mb-5 print:hidden">
            {/* Tab 1: جدول الاستهلاك الشهري (ساهر) */}
            <button
              type="button"
              onClick={() => setActiveView('monthly')}
              className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeView === 'monthly'
                  ? 'bg-[#0b192c] text-white border-b-[3px] border-[#eab308] shadow-md'
                  : 'bg-white text-[#0b192c] hover:bg-slate-100 border border-slate-200 shadow-xs'
              }`}
            >
              <TableProperties
                size={17}
                className={activeView === 'monthly' ? 'text-[#eab308]' : 'text-slate-500'}
              />
              <span>جدول الاستهلاك الشهري (ساهر)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold font-mono tabular-nums bg-[#e0f2fe] text-[#0369a1]">
                {currentYear}
              </span>
            </button>

            {/* Tab 2: فرق الاستهلاك السنوي */}
            <button
              type="button"
              onClick={() => setActiveView('annual_diff')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeView === 'annual_diff'
                  ? 'bg-[#0b192c] text-white border-b-[3px] border-[#eab308] shadow-md'
                  : 'bg-white text-[#0b192c] hover:bg-slate-100 border border-slate-200 shadow-xs'
              }`}
            >
              <span>فرق الاستهلاك السنوي</span>
              <BarChart3
                size={17}
                className={activeView === 'annual_diff' ? 'text-[#eab308]' : 'text-slate-600'}
              />
            </button>

            {/* Tab 3: الجدول الرئيسي */}
            <button
              type="button"
              onClick={() => setActiveView('monthly')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeView === 'monthly'
                  ? 'bg-white text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50'
                  : 'bg-[#0b192c] text-white border-b-[2px] border-[#eab308] shadow-xs'
              }`}
            >
              <span>الجدول الرئيسي</span>
            </button>
          </div>

          {activeView === 'annual_diff' ? (
            <AnnualConsumptionSystem
              onBackToMonthly={() => setActiveView('monthly')}
              monthlySites={currentSitesData}
              archivedMonthlySites={currentArchivedData}
              onSyncSiteMetadata={handleSyncFromAnnualMetadata}
              onSyncAddSite={handleSyncFromAnnualAdd}
              onSyncArchiveSite={handleSyncFromAnnualArchive}
              onSyncRestoreSite={handleSyncFromAnnualRestore}
              onSyncDeleteSite={handleSyncFromAnnualDelete}
            />
          ) : (
            <>
              {/* 5 KPI Summary Cards Row */}
              <MonthlyKpiCards
                currentSites={currentSitesData}
                previousYearSites={previousYearSitesData}
              />

              {/* Main Monthly Consumption Table & Controls */}
              <ConsumptionTable
                year={currentYear}
                data={currentSitesData}
                archivedData={currentArchivedData}
                onDataChange={handleDataChange}
                onAddSite={handleGlobalAddSite}
                onSiteMetadataUpdate={handleSiteMetadataUpdate}
                onArchiveSite={handleArchiveSite}
                onRestoreSite={handleRestoreSite}
                onDeletePermanently={handleDeletePermanently}
                onSave={handleManualSave}
                onOpenAnnualComparison={() => setActiveView('annual_diff')}
              />
            </>
          )}
        </div>
      </main>

      {/* Corporate Footer */}
      <Footer />
    </div>
  );
}

export default App;