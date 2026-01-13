import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ConsumptionTable from './components/ConsumptionTable';
import { INITIAL_SITES } from './constants';
import { SiteData } from './types';

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

  // State to hold the template for sites (used for new years or initializing)
  const [templateSites, setTemplateSites] = useState<SiteData[]>(() => getInitialData());

  // State to hold data for ALL years: { 2025: [...], 2026: [...] }
  const [dataByYear, setDataByYear] = useState<Record<number, SiteData[]>>({});

  // State to hold ARCHIVED (deleted) data for ALL years
  const [archivesByYear, setArchivesByYear] = useState<Record<number, SiteData[]>>({});

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

      // Append to all other existing years
      Object.keys(updatedDataByYear).forEach(key => {
        const yearKey = Number(key);
        if (yearKey === currentYear) return;
        
        const siteExists = updatedDataByYear[yearKey].some(s => s.id === newSite.id);
        if (!siteExists) {
           updatedDataByYear[yearKey] = [...updatedDataByYear[yearKey], newSite];
        }
      });

      return updatedDataByYear;
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
            onArchiveSite={handleArchiveSite}
            onRestoreSite={handleRestoreSite}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;