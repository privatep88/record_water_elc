import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { SiteData, MONTHS, MonthKey, RowType, ConsumptionRow, Attachment } from '../types';
import { Save, Printer, Plus, Trash2, Archive, RotateCcw, Upload, Download, MapPin, Hash, Activity, Check, Paperclip, FileText, Image as ImageIcon, FileSpreadsheet, X, File, Eye } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';

// Helper to prevent floating point errors (e.g. 0.1 + 0.2 = 0.30000000004)
const safeFloat = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// Auto-resizing textarea component for better text display
const AutoResizeTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ value, onChange, className, style, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  useEffect(() => {
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        adjustHeight();
      }}
      className={`${className} overflow-hidden resize-none box-border block`}
      style={{ ...style }}
      rows={1}
      {...props}
    />
  );
};

interface ConsumptionTableProps {
  year: number;
  data: SiteData[];
  archivedData: SiteData[];
  onDataChange: (newData: SiteData[]) => void;
  onAddSite: (newSite: SiteData) => void;
  onSiteMetadataUpdate: (siteId: string, updates: Partial<SiteData>) => void;
  onArchiveSite: (siteId: string) => void;
  onRestoreSite: (siteId: string) => void;
  onSave: () => void;
}

const ConsumptionTable: React.FC<ConsumptionTableProps> = ({ 
  year, 
  data, 
  archivedData,
  onDataChange, 
  onAddSite,
  onSiteMetadataUpdate,
  onArchiveSite,
  onRestoreSite,
  onSave
}) => {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [showArchive, setShowArchive] = useState(false);
  const archiveRef = useRef<HTMLDivElement>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // State to track which row triggered the file upload
  const [activeUploadRow, setActiveUploadRow] = useState<{siteIndex: number, rowIndex: number} | null>(null);

  // Scroll to archive section when opened
  useEffect(() => {
    if (showArchive && archiveRef.current) {
      archiveRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showArchive]);

  const handleInputChange = useCallback((siteIndex: number, rowIndex: number, month: MonthKey, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    
    // Create a deep copy to avoid mutating state directly
    const newData = [...data];
    const site = { ...newData[siteIndex] };
    const row = { ...site.rows[rowIndex] };
    
    // Update value with safe float parsing (though input is usually clean string, we store number)
    row.values = { ...row.values, [month]: numValue };
    site.rows[rowIndex] = row;
    newData[siteIndex] = site;

    // Trigger recalculation of total rows (vertical summation for costs)
    const totalRowIndex = site.rows.findIndex(r => r.type === RowType.CALCULATED_TOTAL);
    if (totalRowIndex !== -1) {
      const totalRow = { ...site.rows[totalRowIndex] };
      const newTotalValues = { ...totalRow.values };

      // Calculate vertical sum for this month: Sum of all rows where isCost = true
      let monthTotalCost = 0;
      site.rows.forEach(r => {
        // Skip the total row itself to avoid self-reference (though type check covers it)
        if (r.type === RowType.INPUT && r.isCost) {
          monthTotalCost = safeFloat(monthTotalCost + r.values[month]);
        }
      });
      
      newTotalValues[month] = monthTotalCost;
      totalRow.values = newTotalValues;
      site.rows[totalRowIndex] = totalRow;
      newData[siteIndex] = site;
    }

    onDataChange(newData);
  }, [data, onDataChange]);

  const handleSiteNameChange = (siteIndex: number, value: string) => {
    onSiteMetadataUpdate(data[siteIndex].id, { name: value });
  };

  const handleMeterNumberChange = (siteIndex: number, value: string) => {
    onSiteMetadataUpdate(data[siteIndex].id, { meterNumber: value });
  };

  const handleRowLabelChange = (siteIndex: number, rowIndex: number, value: string) => {
    const newData = [...data];
    const site = { ...newData[siteIndex] };
    const rows = [...site.rows];
    rows[rowIndex] = { ...rows[rowIndex], label: value };
    site.rows = rows;
    newData[siteIndex] = site;
    onDataChange(newData);
  };

  // --- Attachment Handlers ---

  const triggerFileUpload = (siteIndex: number, rowIndex: number) => {
    setActiveUploadRow({ siteIndex, rowIndex });
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadRow) return;

    // Size limit check (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("حجم الملف كبير جداً. الرجاء اختيار ملف أصغر من 50 ميجابايت.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      
      const newData = [...data];
      const site = { ...newData[activeUploadRow.siteIndex] };
      const row = { ...site.rows[activeUploadRow.rowIndex] };
      
      const newAttachment: Attachment = {
        id: `att_${Date.now()}`,
        name: file.name,
        type: file.type,
        data: base64Data
      };

      row.attachments = [...(row.attachments || []), newAttachment];
      site.rows[activeUploadRow.rowIndex] = row;
      newData[activeUploadRow.siteIndex] = site;
      
      onDataChange(newData);
      setActiveUploadRow(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = (siteIndex: number, rowIndex: number, attachmentId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المرفق؟")) return;

    const newData = [...data];
    const site = { ...newData[siteIndex] };
    const row = { ...site.rows[rowIndex] };
    
    row.attachments = row.attachments?.filter(a => a.id !== attachmentId) || [];
    site.rows[rowIndex] = row;
    newData[siteIndex] = site;
    onDataChange(newData);
  };

  const getFileIcon = (fileName: string, mimeType: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Images
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      return <ImageIcon size={16} className="text-purple-600" strokeWidth={2.5} />;
    }
    
    // PDF
    if (ext === 'pdf') {
      return <FileText size={16} className="text-red-600" strokeWidth={2.5} />;
    }
    
    // Word / Docs
    if (['doc', 'docx', 'rtf'].includes(ext)) {
      return <FileText size={16} className="text-blue-600" strokeWidth={2.5} />;
    }
    
    // Excel / Spreadsheets
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
      return <FileSpreadsheet size={16} className="text-emerald-600" strokeWidth={2.5} />;
    }

    // PowerPoint
    if (['ppt', 'pptx'].includes(ext)) {
      return <File size={16} className="text-orange-500" strokeWidth={2.5} />;
    }

    // Text
    if (ext === 'txt') {
      return <FileText size={16} className="text-gray-500" strokeWidth={2.5} />;
    }
    
    // Default
    return <File size={16} className="text-slate-400" strokeWidth={2} />;
  };

  // --- End Attachment Handlers ---

  const handleAddSite = () => {
    const timestamp = Date.now();
    const createEmptyMonthValues = () => {
      const v: Record<string, number> = {};
      MONTHS.forEach(m => v[m.key] = 0);
      return v as Record<MonthKey, number>;
    };

    const newSite: SiteData = {
      id: `site_${timestamp}`,
      name: 'موقع جديد',
      meterNumber: '',
      startYear: year, // Set the current year as the start year
      rows: [
        { id: `s_${timestamp}_r1`, label: 'الماء ( متر مكعب)', unit: '', type: RowType.INPUT, isCost: false, values: createEmptyMonthValues(), attachments: [] },
        { id: `s_${timestamp}_r2`, label: 'قيمة الاستهلاك الماء', type: RowType.INPUT, isCost: true, values: createEmptyMonthValues(), attachments: [] },
        { id: `s_${timestamp}_r3`, label: 'الكهرباء ( كيلو واط )', unit: '', type: RowType.INPUT, isCost: false, values: createEmptyMonthValues(), attachments: [] },
        { id: `s_${timestamp}_r4`, label: 'قيمة الاستهلاك الكهرباء', type: RowType.INPUT, isCost: true, values: createEmptyMonthValues(), attachments: [] },
        { id: `s_${timestamp}_total`, label: 'إجمالي قيمة الاستهلاك', type: RowType.CALCULATED_TOTAL, isCost: false, values: createEmptyMonthValues(), attachments: [] },
      ]
    };
    
    // Call the parent handler to add this site globally
    onAddSite(newSite);
  };

  const handleDeleteSite = (siteIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الموقع وكافة بياناته؟')) {
      onArchiveSite(data[siteIndex].id);
    }
  };

  const handleRestore = (siteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من رغبتك في استعادة هذا الموقع؟')) {
      onRestoreSite(siteId);
    }
  };

  const handleImportClick = () => {
    if (importInputRef.current) {
      importInputRef.current.click();
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;

      try {
        const wb = read(bstr, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = utils.sheet_to_json<any[]>(ws, { header: 1 });

        const importedSites: SiteData[] = [];
        let currentSite: SiteData | null = null;

        // Skip header row (index 0)
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          const siteName = row[0];
          const meterNumber = row[1];
          const label = row[2];

          if (siteName) {
            if (currentSite) {
              importedSites.push(currentSite);
            }
            const timestamp = Date.now() + i;
            currentSite = {
              id: `site_imp_${timestamp}`,
              name: String(siteName),
              meterNumber: meterNumber ? String(meterNumber) : '',
              startYear: year,
              rows: []
            };
          }

          if (!currentSite && !siteName) {
            continue;
          }

          if (label && currentSite) {
             const labelStr = String(label);
             const isTotal = labelStr.includes('إجمالي') || labelStr.includes('Total');
             const isCost = labelStr.includes('قيمة') || labelStr.includes('Value') || labelStr.includes('Price');
             
             const monthValues: Record<MonthKey, number> = {} as any;
             MONTHS.forEach((m, idx) => {
               const val = row[3 + idx];
               monthValues[m.key] = typeof val === 'number' ? val : 0;
             });

             const newRow: ConsumptionRow = {
               id: `r_imp_${Date.now()}_${i}`,
               label: labelStr,
               type: isTotal ? RowType.CALCULATED_TOTAL : RowType.INPUT,
               isCost: isCost,
               unit: '', 
               values: monthValues,
               attachments: [] // Attachments are lost on Excel import/export usually unless handled specifically
             };

             if (isTotal) newRow.isCost = false;

             currentSite.rows.push(newRow);
          }
        }

        if (currentSite) {
          importedSites.push(currentSite);
        }

        if (importedSites.length > 0) {
          if (window.confirm(`تم العثور على ${importedSites.length} موقع. هل تريد استبدال البيانات الحالية بالبيانات المستوردة؟`)) {
            onDataChange(importedSites);
          }
        } else {
          alert('لم يتم العثور على بيانات صالحة في الملف.');
        }

      } catch (error) {
        console.error("Error reading file:", error);
        alert('حدث خطأ أثناء قراءة الملف. تأكد من أن الملف هو ملف Excel صالح.');
      } finally {
        if (importInputRef.current) {
          importInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const calculateHorizontalTotal = (values: Record<MonthKey, number>): number => {
    const sum = Object.values(values).reduce((sum, current) => sum + current, 0);
    return safeFloat(sum);
  };

  const formatNumber = (num: number) => {
    // Avoid displaying -0 or strange tiny floating points
    if (Math.abs(num) < 0.005) return "0";
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  // Calculate Grand Totals (Sum of all sites' totals per month)
  const grandTotals = useMemo(() => {
    const totals: Record<MonthKey, number> = {
      jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
      jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
    };
    
    data.forEach(site => {
      // Find the calculated total row for this site
      const totalRow = site.rows.find(r => r.type === RowType.CALCULATED_TOTAL);
      
      // Fallback: If no Total Row exists, sum up isCost rows manually
      if (totalRow) {
        MONTHS.forEach(month => {
          totals[month.key] = safeFloat(totals[month.key] + totalRow.values[month.key]);
        });
      } else {
        site.rows.filter(r => r.isCost).forEach(row => {
          MONTHS.forEach(month => {
            totals[month.key] = safeFloat(totals[month.key] + row.values[month.key]);
          });
        });
      }
    });

    return totals;
  }, [data]);

  const grandTotalHorizontal = calculateHorizontalTotal(grandTotals);

  const handleExportClick = () => {
    try {
      // 1. Build the Header
      const headers = [
        'الموقع',
        'رقم العداد',
        'نوع الاستهلاك',
        ...MONTHS.map(m => m.label),
        'المجموع',
        'المرفقات' // Add attachments to header
      ];

      // 2. Build the Body
      const body: any[][] = [];

      data.forEach(site => {
        site.rows.forEach((row, index) => {
          const rowTotal = calculateHorizontalTotal(row.values);
          // List attachment names
          const attachmentsList = row.attachments?.map(a => a.name).join(', ') || '';

          const rowData = [
            index === 0 ? site.name : '', 
            index === 0 ? site.meterNumber : '',
            row.label,
            ...MONTHS.map(m => row.values[m.key]),
            rowTotal,
            attachmentsList // Add attachment names to row
          ];
          body.push(rowData);
        });
        // Add empty row between sites for readability
        body.push([]);
      });

      // 3. Grand Total Row
      const grandTotalRow = [
        'الإجمالي الكلي (درهم)',
        '',
        '',
        ...MONTHS.map(m => grandTotals[m.key]),
        grandTotalHorizontal,
        ''
      ];
      
      body.push(grandTotalRow);

      const finalData = [headers, ...body];

      const wb = utils.book_new();
      const ws = utils.aoa_to_sheet(finalData);
      
      // Merges
      const merges = [];
      let currentRow = 1;
      
      data.forEach(site => {
        const rowCount = site.rows.length;
        if (rowCount > 0) {
          // Merge Site Name
          merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow + rowCount - 1, c: 0 } });
          // Merge Meter Number
          merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow + rowCount - 1, c: 1 } });
          
          currentRow += rowCount + 1; // +1 for the empty row we added
        }
      });
      
      // Merge Grand Total Label
      const totalRowIndex = currentRow;
      merges.push({ s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 2 } });

      ws['!merges'] = merges;
      
      const wch = (chars: number) => ({ wch: chars });
      ws['!cols'] = [
          wch(30), // Site
          wch(20), // Meter
          wch(25), // Type
          ...MONTHS.map(() => wch(12)), // Months
          wch(18),  // Total
          wch(25)   // Attachments
      ];

      utils.book_append_sheet(wb, ws, `استهلاك ${year}`);
      writeFile(wb, `Saher_Consumption_${year}.xlsx`);
    } catch (e) {
      console.error("Export Error:", e);
      alert("حدث خطأ أثناء تصدير الملف. الرجاء المحاولة مرة أخرى.");
    }
  };

  const handleSaveClick = () => {
    onSave();
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  // Common render function for table rows to be used by both Active and Archive tables
  const renderRows = (
    sites: SiteData[], 
    isArchive: boolean, 
    handleAction: (index: number, id: string, e: React.MouseEvent) => void
  ) => {
    return sites.map((site, siteIndex) => (
      <React.Fragment key={site.id}>
        {/* Header row repeater for subsequent sites */}
        {siteIndex > 0 && (
          <tr className={`${isArchive ? 'bg-red-800' : 'bg-[#334155]'} text-white font-bold border-y ${isArchive ? 'border-red-900' : 'border-slate-600'}`}>
            <td className={`p-2 border-r ${isArchive ? 'border-red-700' : 'border-slate-600'} align-middle`}>
               <div className="flex items-center justify-center h-full w-full text-center gap-1">
                 <MapPin size={14} className="text-white" />
                 <span>الموقع</span>
               </div>
            </td>
            <td className={`p-2 border-r ${isArchive ? 'border-red-700' : 'border-slate-600'} align-middle`}>
               <div className="flex items-center justify-center h-full w-full text-center gap-1">
                 <Hash size={14} className="text-white" />
                 <span>رقم العداد</span>
               </div>
            </td>
            <td className={`p-2 border-r ${isArchive ? 'border-red-700' : 'border-slate-600'} align-middle`}>
               <div className="flex items-center justify-center h-full w-full text-center gap-1">
                 <Activity size={14} className="text-white" />
                 <span>نوع الاستهلاك</span>
               </div>
            </td>
            
            {MONTHS.map((month) => (
              <td key={`header-${site.id}-${month.key}`} className={`p-2 border-r ${isArchive ? 'border-red-700' : 'border-slate-600'} align-middle`}>
                 <div className="flex items-center justify-center h-full w-full text-center">{month.label}</div>
              </td>
            ))}
            
            <td className={`p-2 border-r ${isArchive ? 'border-red-700 bg-red-950' : 'border-slate-600 bg-[#091526]'} text-white align-middle`}>
               <div className="flex items-center justify-center h-full w-full text-center">المجموع</div>
            </td>

            {/* Attachments Header - Repeater */}
            <td className={`p-2 border-r ${isArchive ? 'border-red-700 bg-red-950' : 'border-slate-600 bg-[#091526]'} text-white w-[50px] align-middle`}>
               <div className="flex items-center justify-center h-full w-full text-center">المرفقات</div>
            </td>
          </tr>
        )}

        {site.rows.map((row, rowIndex) => {
          const isFirstRow = rowIndex === 0;
          const isTotalRow = row.type === RowType.CALCULATED_TOTAL;
          const rowTotal = calculateHorizontalTotal(row.values);

          return (
            <tr 
              key={row.id} 
              className={`
                hover:bg-blue-50 transition-colors 
                ${isTotalRow ? (isArchive ? 'bg-red-100 text-red-900 border-t border-red-200' : 'bg-blue-100 font-bold text-blue-900 border-t border-blue-300') : 'text-slate-700'}
                ${rowIndex === site.rows.length - 1 ? (isArchive ? 'border-b-4 border-red-800' : 'border-b-4 border-blue-900') : 'border-b border-gray-200'}
                ${isArchive && !isTotalRow ? 'bg-red-50/50 text-red-800' : ''}
              `}
            >
              {/* Location Cell - Merged */}
              {isFirstRow && (
                <td 
                  rowSpan={site.rows.length} 
                  className={`${isArchive ? 'bg-red-50' : 'bg-blue-50/50'} font-bold border-r ${isArchive ? 'border-red-200' : 'border-blue-200'} p-2 align-middle text-base break-words relative group`}
                >
                   <div className="flex flex-col items-center justify-center h-full w-full relative">
                       <button 
                         type="button"
                         onClick={(e) => handleAction(siteIndex, site.id, e)}
                         className={`p-1.5 mb-2 rounded-full shadow-sm border transition-all duration-200 print:hidden z-20 cursor-pointer
                           ${isArchive 
                             ? 'text-green-600 bg-white border-green-200 hover:bg-green-50' 
                             : 'text-red-500 bg-white border-red-100 hover:bg-red-50 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'}`}
                         title={isArchive ? "استعادة الموقع" : "حذف الموقع"}
                       >
                         {isArchive ? <RotateCcw size={16} /> : <Trash2 size={16} />}
                       </button>
                       <AutoResizeTextarea
                        disabled={isArchive}
                        value={site.name}
                        onChange={(e) => handleSiteNameChange(siteIndex, e.target.value)}
                        className={`w-full bg-transparent text-center border-none focus:ring-2 focus:ring-blue-500 focus:bg-white p-2 outline-none whitespace-normal break-words leading-tight rounded ${isArchive ? 'cursor-not-allowed text-red-900' : 'text-blue-900'}`}
                        placeholder="اسم الموقع"
                        style={{ margin: '0 auto', minHeight: '60px' }}
                      />
                   </div>
                </td>
              )}

              {/* Meter Number Cell - Merged */}
              {isFirstRow && (
                <td 
                  rowSpan={site.rows.length} 
                  className={`${isArchive ? 'bg-red-50' : 'bg-gray-50/50'} font-mono text-xs md:text-sm border-r ${isArchive ? 'border-red-200' : 'border-blue-200'} p-2 align-middle break-words`}
                >
                   <div className="flex items-center justify-center h-full w-full">
                       <AutoResizeTextarea
                        disabled={isArchive}
                        value={site.meterNumber}
                        onChange={(e) => handleMeterNumberChange(siteIndex, e.target.value)}
                        className={`w-full bg-transparent text-center border-none focus:ring-2 focus:ring-blue-500 focus:bg-white p-2 outline-none font-mono whitespace-normal break-all leading-tight rounded ${isArchive ? 'cursor-not-allowed text-red-700' : 'text-slate-600'}`}
                         placeholder="رقم العداد"
                         style={{ margin: 'auto' }}
                      />
                   </div>
                </td>
              )}

              {/* Consumption Label */}
              <td className={`p-1 border-r ${isArchive ? 'border-red-200' : 'border-blue-200'} relative align-middle ${row.isCost && !isArchive ? 'text-blue-800 font-semibold' : ''} ${isArchive && row.isCost ? 'text-red-800 font-bold' : ''}`}>
                 <div className="flex flex-col items-center justify-center w-full h-full min-h-[40px]">
                   {row.unit && <span className={`text-[10px] whitespace-nowrap mb-1 px-1 rounded ${isArchive ? 'bg-red-100 text-red-600' : 'bg-blue-50/50 text-blue-400'}`}>{row.unit}</span>}
                   <AutoResizeTextarea
                      disabled={isArchive}
                      value={row.label}
                      onChange={(e) => handleRowLabelChange(siteIndex, rowIndex, e.target.value)}
                      className={`w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 focus:bg-blue-50 outline-none text-center leading-tight whitespace-normal break-words ${row.isCost ? 'font-bold' : ''} ${isArchive ? 'cursor-not-allowed' : ''}`}
                      style={{ margin: 'auto' }}
                   />
                 </div>
              </td>

              {/* Month Input Cells */}
              {MONTHS.map((month) => (
                <td key={`${row.id}-${month.key}`} className={`border-r ${isArchive ? 'border-red-100' : 'border-blue-100'} p-0 relative align-middle min-h-[3rem] h-auto ${isTotalRow ? (isArchive ? 'bg-red-100' : 'bg-blue-100/50') : ''}`}>
                   {isTotalRow || isArchive ? (
                     <div className={`w-full min-h-full flex items-center justify-center bg-transparent text-center text-xs sm:text-sm break-all px-1 py-3 ${isArchive ? 'text-red-900' : 'text-blue-900'}`}>
                       {formatNumber(row.values[month.key])}
                     </div>
                   ) : (
                     <input
                       type="number"
                       min="0"
                       step="0.01"
                       value={row.values[month.key] === 0 ? '' : row.values[month.key]}
                       onChange={(e) => handleInputChange(siteIndex, rowIndex, month.key, e.target.value)}
                       className="w-full h-full min-h-[3rem] text-center bg-transparent focus:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all placeholder-gray-300 text-xs sm:text-sm flex items-center justify-center text-slate-700 font-medium p-1"
                       placeholder="0"
                     />
                   )}
                </td>
              ))}

              {/* Row Total */}
              <td className={`border-r ${isArchive ? 'border-red-200' : 'border-blue-200'} font-bold align-middle px-1 break-all text-xs sm:text-sm ${isArchive ? 'bg-red-100 text-red-900' : 'bg-yellow-50/50 text-slate-800'}`}>
                <div className="flex items-center justify-center w-full h-full">
                    {formatNumber(rowTotal)}
                </div>
              </td>

              {/* Attachments Column */}
              <td className={`border-r ${isArchive ? 'border-red-200' : 'border-blue-200'} align-middle px-1 w-[50px]`}>
                <div className="flex flex-col items-center justify-center w-full h-full gap-1 p-1">
                  
                  {/* File List */}
                  {row.attachments && row.attachments.length > 0 && (
                     <div className="flex flex-wrap gap-1 justify-center mb-1 max-w-[100px]">
                       {row.attachments.map((att) => (
                         <div key={att.id} className="relative group cursor-pointer" title={att.name}>
                            <a href={att.data} download={att.name} className="block p-1 bg-white rounded border border-gray-200 hover:border-blue-400 shadow-sm transition-all">
                               {getFileIcon(att.name, att.type)}
                            </a>
                            {!isArchive && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteAttachment(siteIndex, rowIndex, att.id);
                                }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-[1px] opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={10} />
                              </button>
                            )}
                         </div>
                       ))}
                     </div>
                  )}

                  {/* Add Button */}
                  {!isArchive && (
                    <button 
                      onClick={() => triggerFileUpload(siteIndex, rowIndex)}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="إرفاق ملف"
                    >
                      <Paperclip size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </React.Fragment>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input used for uploading */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
      />

      {/* Title Bar */}
      <div className="bg-[#091526] p-4 rounded-t-lg border-b-4 border-yellow-500 shadow-sm text-center relative">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
          نسبة استهلاك الماء والكهرباء لمقرات ساهر - لسنة <span className="text-yellow-400">{year}</span>
        </h2>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2 print:hidden">
           <input 
             type="file" 
             ref={importInputRef} 
             onChange={handleImportFileChange} 
             accept=".xlsx, .xls" 
             className="hidden" 
           />
           <button onClick={handleImportClick} className="bg-blue-800 hover:bg-blue-700 text-blue-100 p-2 rounded transition-all border border-blue-700 flex items-center gap-1" title="استيراد من Excel">
             <Upload size={18} />
             <span className="hidden md:inline text-xs">استيراد</span>
           </button>
           <button onClick={handleExportClick} className="bg-blue-800 hover:bg-blue-700 text-blue-100 p-2 rounded transition-all border border-blue-700 flex items-center gap-1" title="تصدير الى Excel">
             <Download size={18} />
             <span className="hidden md:inline text-xs">تصدير</span>
           </button>
           <button onClick={() => window.print()} className="bg-blue-800 hover:bg-blue-700 text-blue-100 p-2 rounded transition-all border border-blue-700" title="طباعة">
             <Printer size={18} />
           </button>
           <button onClick={handleSaveClick} className="bg-blue-800 hover:bg-blue-700 text-blue-100 p-2 rounded transition-all border border-blue-700 flex items-center justify-center min-w-[36px]" title="حفظ">
             {saveStatus === 'saved' ? <Check size={18} className="text-green-400" /> : <Save size={18} />}
           </button>
        </div>
      </div>

      {/* Archive Button Section */}
      <div className="flex justify-start px-1 print:hidden">
        <button
          onClick={() => setShowArchive(!showArchive)}
          className="flex items-center gap-2 bg-[#091526] hover:bg-blue-800 text-white px-4 py-2 rounded shadow transition-all text-sm font-bold border border-blue-900/50"
        >
          <Archive size={16} />
          سجل الأرشيف
          {archivedData.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full mr-1">
                {archivedData.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto border border-blue-900 rounded-b-lg shadow-lg bg-white print:shadow-none print:border-none">
        <table className="w-full text-sm text-center border-collapse min-w-[1200px] table-fixed">
          <thead>
            <tr className="bg-[#334155] text-white font-bold border-b border-slate-600">
              <th className="p-3 border-r border-slate-600 w-[180px] align-middle">
                <div className="flex items-center justify-center h-full w-full text-center gap-2">
                  <MapPin size={16} className="text-white" />
                  <span>الموقع</span>
                </div>
              </th>
              <th className="p-3 border-r border-slate-600 w-[120px] align-middle">
                 <div className="flex items-center justify-center h-full w-full text-center gap-2">
                   <Hash size={16} className="text-white" />
                   <span>رقم العداد</span>
                 </div>
              </th>
              <th className="p-3 border-r border-slate-600 w-[140px] align-middle">
                 <div className="flex items-center justify-center h-full w-full text-center gap-2">
                   <Activity size={16} className="text-white" />
                   <span>نوع الاستهلاك</span>
                 </div>
              </th>
              
              {MONTHS.map((month) => (
                <th key={month.key} className="p-2 border-r border-slate-600 align-middle">
                   <div className="flex items-center justify-center h-full w-full text-center">{month.label}</div>
                </th>
              ))}
              
              <th className="p-3 border-r border-slate-600 bg-[#091526] text-white w-[85px] align-middle">
                 <div className="flex items-center justify-center h-full w-full text-center">المجموع</div>
              </th>
              {/* Attachments Column Header */}
              <th className="p-3 border-r border-slate-600 bg-[#091526] text-white w-[50px] align-middle">
                 <div className="flex items-center justify-center h-full w-full text-center">المرفقات</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {renderRows(data, false, (idx, id, e) => handleDeleteSite(idx, e))}
          </tbody>
        </table>
      </div>

      {/* Add Site Button */}
      <div className="flex justify-start px-1 print:hidden">
        <button
          onClick={handleAddSite}
          className="flex items-center gap-2 bg-[#091526] hover:bg-blue-800 text-white px-4 py-2 rounded shadow transition-all text-sm font-bold border border-blue-900/50"
        >
          <Plus size={16} />
          إضافة موقع جديد
        </button>
      </div>

      {/* Separated Grand Total Table */}
      <div className="mt-4 overflow-x-auto border border-blue-900 rounded-lg shadow-lg bg-white print:shadow-none print:border-none">
        <table className="w-full text-sm text-center border-collapse min-w-[1200px] table-fixed">
          {/* ColGroup ensures alignment with the main table */}
          <colgroup>
            <col className="w-[180px]" />
            <col className="w-[120px]" />
            <col className="w-[140px]" />
            {MONTHS.map(m => <col key={m.key} />)}
            <col className="w-[85px]" />
            <col className="w-[50px]" /> {/* Spacer for attachments col */}
          </colgroup>
          <tbody>
            <tr className="bg-blue-200 text-blue-900 font-bold text-sm">
               <td colSpan={3} className="p-3 text-center border-r border-blue-800 align-middle bg-[#091526] text-white">
                 <div className="flex items-center justify-center w-full h-full">الإجمالي الكلي (درهم)</div>
               </td>
               {MONTHS.map((month) => (
                  <td key={`grand-${month.key}`} className="p-2 border-r border-blue-800 text-center bg-blue-200 align-middle break-all text-xs sm:text-sm">
                    <div className="flex items-center justify-center w-full h-full">
                       {formatNumber(grandTotals[month.key])}
                    </div>
                  </td>
               ))}
               <td className="p-2 bg-yellow-500 text-black text-center border-r border-blue-800 align-middle break-all text-xs sm:text-sm shadow-inner">
                 <div className="flex items-center justify-center w-full h-full font-black text-base">
                    {formatNumber(grandTotalHorizontal)}
                 </div>
               </td>
               {/* Empty cell for attachments col */}
               <td className="p-2 bg-blue-200 border-r border-blue-800"></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Archive Section - Collapsible */}
      {showArchive && (
        <div ref={archiveRef} className="mt-12 pt-8 border-t-4 border-red-300 print:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-red-800">
              <Archive size={24} />
              <h3 className="text-xl font-bold">سجل الأرشيف (المواقع المحذوفة)</h3>
            </div>
            <button 
              onClick={() => setShowArchive(false)}
              className="text-red-600 underline text-sm hover:text-red-800"
            >
              إغلاق السجل
            </button>
          </div>
          
          {archivedData.length === 0 ? (
            <div className="bg-red-50 border border-red-100 rounded-lg p-8 text-center text-red-800">
                لا يوجد مواقع في الأرشيف حالياً.
            </div>
          ) : (
            <div className="overflow-x-auto border border-red-200 rounded-lg shadow-sm bg-white">
              <table className="w-full text-sm text-center border-collapse min-w-[1200px] table-fixed">
                <thead>
                  <tr className="bg-red-800 text-white font-bold border-b border-red-900">
                    <th className="p-3 border-r border-red-700 w-[180px] align-middle">
                      <div className="flex items-center justify-center h-full w-full text-center gap-2">
                        <MapPin size={16} className="text-white" />
                        <span>الموقع</span>
                      </div>
                    </th>
                    <th className="p-3 border-r border-red-700 w-[120px] align-middle">
                      <div className="flex items-center justify-center h-full w-full text-center gap-2">
                        <Hash size={16} className="text-white" />
                        <span>رقم العداد</span>
                      </div>
                    </th>
                    <th className="p-3 border-r border-red-700 w-[140px] align-middle">
                      <div className="flex items-center justify-center h-full w-full text-center gap-2">
                        <Activity size={16} className="text-white" />
                        <span>نوع الاستهلاك</span>
                      </div>
                    </th>
                    {MONTHS.map((month) => (
                      <th key={month.key} className="p-2 border-r border-red-700 align-middle">{month.label}</th>
                    ))}
                    <th className="p-3 border-r border-red-700 bg-red-950 text-white w-[85px] align-middle">المجموع</th>
                    <th className="p-3 border-r border-red-700 bg-red-950 text-white w-[50px] align-middle">المرفقات</th>
                  </tr>
                </thead>
                <tbody>
                  {renderRows(archivedData, true, (idx, id, e) => handleRestore(id, e))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-4">
          <div className="text-sm text-gray-500 italic">
              * يتم حساب المجاميع أفقياً وعمودياً بشكل تلقائي.
              <br/>
              * يمكن تعديل أسماء المواقع، أرقام العدادات، ومسميات الاستهلاك بالضغط عليها مباشرة.
              <br/>
              * لارفاق ملف، اضغط على أيقونة المشبك. يتم حفظ الملفات محلياً (الحجم الأقصى 50MB).
          </div>
      </div>
    </div>
  );
};

export default ConsumptionTable;