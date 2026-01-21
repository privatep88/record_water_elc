import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import ConsumptionTable from './components/ConsumptionTable.tsx';
import { INITIAL_SITES } from './constants.ts';
import { SiteData } from './types.ts';

// Storage Keys
const STORAGE_KEYS = {
  DATA: 'saher_dashboard_data',
  TEMPLATE: 'saher_dashboard_template',
  ARCHIVES: 'saher_dashboard_archives'
};

// Helper function to deep clone the initial data so we don't modify the constant
const getInitialData = (): SiteData[] => {
  return JSON.parse(JSON.stringify(INITIAL_SITES));
};

function App() {
  // Set default year to 2026 as requested
  const [currentYear, setCurrentYear] = useState(2026);
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
      console.warn("Error reading template from storage", e);
      return getInitialData();
    }
  });

  const [dataByYear, setDataByYear] = useState<Record<number, SiteData[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DATA);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.warn("Error reading data from storage", e);
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
        alert("تنبيه: ذاكرة المتصفح ممتلئة. قد لا يتم حفظ التعديلات الأخيرة أو المرفقات الكبيرة.");
      } else {
        console.error(`Failed to save ${key}`, e);
      }
    }
  }, []);

  // Auto-save Effect
  useEffect(() => {
    // This effect runs automatically whenever data changes.
    // We check `isMounted.current` to prevent it from running on the initial page load.
    if (isMounted.current) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setAutoSaveStatus('saving');
      
      // Debounce the save operation: wait 1000ms after the last change before saving.
      saveTimeoutRef.current = window.setTimeout(() => {
          saveData(STORAGE_KEYS.DATA, dataByYear);
          saveData(STORAGE_KEYS.TEMPLATE, templateSites);
          saveData(STORAGE_KEYS.ARCHIVES, archivesByYear);
          setAutoSaveStatus('saved');
  
          // Show "saved" message for 1.5 seconds, then return to idle.
          saveTimeoutRef.current = window.setTimeout(() => {
              setAutoSaveStatus('idle');
          }, 1500);
      }, 1000);
    } else {
      // On first render, just mark the component as mounted.
      isMounted.current = true;
      // Also perform an initial save without showing status, in case data was loaded but needs syncing.
      saveData(STORAGE_KEYS.DATA, dataByYear);
      saveData(STORAGE_KEYS.TEMPLATE, templateSites);
      saveData(STORAGE_KEYS.ARCHIVES, archivesByYear);
    }

    // Cleanup timeout on component unmount or before the next effect runs.
    return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    }
  }, [dataByYear, templateSites, archivesByYear, saveData]);


  // Manual Save Handler
  const handleManualSave = useCallback(() => {
    // If an auto-save is pending, clear it and save immediately
    if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
    }

    saveData(STORAGE_KEYS.DATA, dataByYear);
    saveData(STORAGE_KEYS.TEMPLATE, templateSites);
    saveData(STORAGE_KEYS.ARCHIVES, archivesByYear);
    
    // Also trigger the "Saved" status in the header for feedback
    setAutoSaveStatus('saved');
    saveTimeoutRef.current = window.setTimeout(() => {
        setAutoSaveStatus('idle');
    }, 1500);

  }, [dataByYear, templateSites, archivesByYear, saveData]);

  // Get the data for the currently selected year.
  // If no data exists for this year, generate a fresh copy based on the CURRENT template.
  const currentSitesData = useMemo(() => {
    let data: SiteData[] = [];
    if (dataByYear[currentYear]) {
      data = dataByYear[currentYear];
    } else {
      data = JSON.parse(JSON.stringify(templateSites));
    }

    // Filter out sites that start in a future year relative to the current view.
    return data.filter(site => !site.startYear || site.startYear <= currentYear);

  }, [currentYear, dataByYear, templateSites]);

  // Get the archived data for the currently selected year
  const currentArchivedData = useMemo(() => {
    return archivesByYear[currentYear] || [];
  }, [currentYear, archivesByYear]);

  // Handle value updates from the table (local to the current year)
  const handleDataChange = (newData: SiteData[]) => {
    setDataByYear(prev => ({
      ...prev,
      [currentYear]: newData
    }));
  };

  // Handle global site addition (updates ALL years and the template)
  const handleGlobalAddSite = (newSite: SiteData) => {
    // 1. Update the template
    setTemplateSites(prev => [...prev, JSON.parse(JSON.stringify(newSite))]);

    // 2. Update ONLY the years that have already been instantiated
    setDataByYear(prev => {
      const updatedDataByYear = { ...prev };
      
      const appendSiteToYear = (y: number) => {
        if (updatedDataByYear[y]) {
          const exists = updatedDataByYear[y].some(s => s.id === newSite.id);
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

      Object.keys(updatedDataByYear).forEach(key => {
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
    const updateList = (list: SiteData[]) => list.map(s => {
      if (s.id === siteId) {
        return { ...s, ...updates };
      }
      return s;
    });

    setTemplateSites(prev => updateList(prev));

    setDataByYear(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        const year = Number(key);
        next[year] = updateList(next[year]);
      });
      return next;
    });

    setArchivesByYear(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        const year = Number(key);
        next[year] = updateList(next[year]);
      });
      return next;
    });
  };

  const handleArchiveSite = (siteId: string) => {
    const siteToArchive = currentSitesData.find(s => s.id === siteId);
    if (!siteToArchive) return;

    const newActiveData = currentSitesData.filter(s => s.id !== siteId);
    handleDataChange(newActiveData);

    setArchivesByYear(prev => ({
      ...prev,
      [currentYear]: [...(prev[currentYear] || []), siteToArchive]
    }));
  };

  const handleRestoreSite = (siteId: string) => {
    const siteToRestore = currentArchivedData.find(s => s.id === siteId);
    if (!siteToRestore) return;

    setArchivesByYear(prev => ({
      ...prev,
      [currentYear]: prev[currentYear].filter(s => s.id !== siteId)
    }));

    handleDataChange([...currentSitesData, siteToRestore]);
  };

  const handleDeletePermanently = (siteId: string) => {
    setArchivesByYear(prev => ({
      ...prev,
      [currentYear]: prev[currentYear].filter(s => s.id !== siteId)
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <Header currentYear={currentYear} onYearChange={setCurrentYear} autoSaveStatus={autoSaveStatus} />
      
      <main className="flex-grow w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 md:p-6 min-h-[500px]">
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
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;