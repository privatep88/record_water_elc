import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ConsumptionTable from './components/ConsumptionTable';
import { INITIAL_SITES } from './constants';
import { SiteData } from './types';

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
      return getInitialData();
    }
  });

  const [dataByYear, setDataByYear] = useState<Record<number, SiteData[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DATA);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
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

  // Auto-save Effect: Saves whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(dataByYear));
      localStorage.setItem(STORAGE_KEYS.TEMPLATE, JSON.stringify(templateSites));
      localStorage.setItem(STORAGE_KEYS.ARCHIVES, JSON.stringify(archivesByYear));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }, [dataByYear, templateSites, archivesByYear]);

  // Manual Save Handler
  const handleManualSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(dataByYear));
      localStorage.setItem(STORAGE_KEYS.TEMPLATE, JSON.stringify(templateSites));
      localStorage.setItem(STORAGE_KEYS.ARCHIVES, JSON.stringify(archivesByYear));
    } catch (e) {
      console.error("Failed to save manually", e);
    }
  }, [dataByYear, templateSites, archivesByYear]);

  // State to hold data for ALL years: { 2025: [...], 2026: [...] }
  // (State declarations are moved up for localStorage init)

  // Get the data for the currently selected year.
  // If no data exists for this year, generate a fresh copy based on the CURRENT template.
  const currentSitesData = useMemo(() => {
    if (dataByYear[currentYear]) {
      return dataByYear[currentYear];
    }
    // Deep copy the template sites to ensure independence between years
    return JSON.parse(JSON.stringify(templateSites));
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
    // 1. Update the template so any future years accessed will have this site
    setTemplateSites(prev => [...prev, newSite]);

    // 2. Update all existing years in the history to include this new site
    setDataByYear(prev => {
      const updatedDataByYear = { ...prev };
      
      // If the current year isn't in dataByYear yet (it was using templateSites), 
      // initialize it so the user sees the update immediately
      if (!updatedDataByYear[currentYear]) {
        updatedDataByYear[currentYear] = [...templateSites, newSite];
      } else {
        updatedDataByYear[currentYear] = [...updatedDataByYear[currentYear], newSite];
      }

      // Append to all other existing years (CURRENT OR FUTURE ONLY)
      Object.keys(updatedDataByYear).forEach(key => {
        const yearKey = Number(key);
        
        // Skip past years - Do not add new sites to years prior to the current one
        if (yearKey < currentYear) return;

        if (yearKey === currentYear) return;
        
        const siteExists = updatedDataByYear[yearKey].some(s => s.id === newSite.id);
        if (!siteExists) {
           updatedDataByYear[yearKey] = [...updatedDataByYear[yearKey], newSite];
        }
      });

      return updatedDataByYear;
    });
  };

  // Handle updates to site metadata (Name, Meter Number) across ALL years
  const handleSiteMetadataUpdate = (siteId: string, updates: Partial<SiteData>) => {
    const updateList = (list: SiteData[]) => list.map(s => {
      if (s.id === siteId) {
        return { ...s, ...updates };
      }
      return s;
    });

    // 1. Update Template
    setTemplateSites(prev => updateList(prev));

    // 2. Update All Years
    setDataByYear(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        const year = Number(key);
        next[year] = updateList(next[year]);
      });
      return next;
    });

    // 3. Update Archives
    setArchivesByYear(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        const year = Number(key);
        next[year] = updateList(next[year]);
      });
      return next;
    });
  };

  // Handle moving a site to the archive
  const handleArchiveSite = (siteId: string) => {
    const siteToArchive = currentSitesData.find(s => s.id === siteId);
    if (!siteToArchive) return;

    // Remove from active list
    const newActiveData = currentSitesData.filter(s => s.id !== siteId);
    handleDataChange(newActiveData);

    // Add to archive list for this year
    setArchivesByYear(prev => ({
      ...prev,
      [currentYear]: [...(prev[currentYear] || []), siteToArchive]
    }));
  };

  // Handle restoring a site from the archive
  const handleRestoreSite = (siteId: string) => {
    const siteToRestore = currentArchivedData.find(s => s.id === siteId);
    if (!siteToRestore) return;

    // Remove from archive list
    setArchivesByYear(prev => ({
      ...prev,
      [currentYear]: prev[currentYear].filter(s => s.id !== siteId)
    }));

    // Add back to active list
    handleDataChange([...currentSitesData, siteToRestore]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <Header currentYear={currentYear} onYearChange={setCurrentYear} />
      
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
            onSave={handleManualSave}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;