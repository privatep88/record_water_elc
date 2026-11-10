import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { SiteData, MONTHS, MonthKey, RowType, ConsumptionRow, Attachment } from '../types.ts';
import {
  Save,
  Printer,
  Plus,
  Trash2,
  Archive,
  RotateCcw,
  Upload,
  Download,
  MapPin,
  Hash,
  Activity,
  Check,
  Paperclip,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  X,
  File,
  FolderOpen,
  PlusCircle,
  BarChart3,
  Droplet,
  Zap,
  Snowflake,
  Coins,
} from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';

// Helper to prevent floating point errors
const safeFloat = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// Iframe-safe confirmation and alert helpers
const safeConfirm = (message: string): boolean => {
  try {
    return window.confirm(message);
  } catch (e) {
    console.warn('window.confirm not supported or blocked in this environment:', e);
    return true;
  }
};

const safeAlert = (message: string): void => {
  try {
    window.alert(message);
  } catch (e) {
    console.warn('window.alert not supported or blocked in this environment:', e, message);
  }
};

// Auto-resizing textarea component
const AutoResizeTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  value,
  onChange,
  className,
  style,
  ...props
}) => {
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
  onDeletePermanently: (siteId: string) => void;
  onSave: () => void;
  onOpenAnnualComparison?: () => void;
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
  onDeletePermanently,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [showArchive, setShowArchive] = useState(false);
  const archiveRef = useRef<HTMLDivElement>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const [activeUploadRow, setActiveUploadRow] = useState<{ siteIndex: number; rowIndex: number } | null>(null);

  useEffect(() => {
    if (showArchive && archiveRef.current) {
      archiveRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showArchive]);

  const calculateSiteTotals = (siteRows: ConsumptionRow[]): ConsumptionRow[] => {
    const newRows = [...siteRows];
    const totalRowIndex = newRows.findIndex((r) => r.type === RowType.CALCULATED_TOTAL);

    if (totalRowIndex !== -1) {
      const totalRow = { ...newRows[totalRowIndex] };
      const newTotalValues = { ...totalRow.values };

      MONTHS.forEach((month) => {
        let monthTotalCost = 0;
        newRows.forEach((r) => {
          if (r.type === RowType.INPUT && r.isCost) {
            monthTotalCost = safeFloat(monthTotalCost + r.values[month.key]);
          }
        });
        newTotalValues[month.key] = monthTotalCost;
      });

      totalRow.values = newTotalValues;
      newRows[totalRowIndex] = totalRow;
    }
    return newRows;
  };

  const handleInputChange = useCallback(
    (siteIndex: number, rowIndex: number, month: MonthKey, value: string) => {
      const numValue = value === '' ? 0 : parseFloat(value);

      const newData = [...data];
      const site = { ...newData[siteIndex] };
      const row = { ...site.rows[rowIndex] };

      row.values = { ...row.values, [month]: numValue };
      site.rows[rowIndex] = row;

      // Recalculate totals
      site.rows = calculateSiteTotals(site.rows);
      newData[siteIndex] = site;

      onDataChange(newData);
    },
    [data, onDataChange]
  );

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

  // --- Row Management (Add/Delete) ---

  const handleAddRow = (siteIndex: number, insertAfterIndex?: number) => {
    const newData = [...data];
    const site = { ...newData[siteIndex] };
    const timestamp = Date.now();

    const createEmptyMonthValues = () => {
      const v: Record<string, number> = {};
      MONTHS.forEach((m) => (v[m.key] = 0));
      return v as Record<MonthKey, number>;
    };

    const newRow: ConsumptionRow = {
      id: `s_${site.id}_r_${timestamp}`,
      label: 'بند جديد',
      type: RowType.INPUT,
      isCost: false,
      values: createEmptyMonthValues(),
      attachments: [],
      unit: '',
    };

    if (typeof insertAfterIndex === 'number') {
      site.rows.splice(insertAfterIndex + 1, 0, newRow);
    } else {
      const totalRowIndex = site.rows.findIndex((r) => r.type === RowType.CALCULATED_TOTAL);
      if (totalRowIndex !== -1) {
        site.rows.splice(totalRowIndex, 0, newRow);
      } else {
        site.rows.push(newRow);
      }
    }

    newData[siteIndex] = site;
    onDataChange(newData);
  };

  const handleDeleteRow = (siteIndex: number, rowIndex: number) => {
    if (!safeConfirm('هل أنت متأكد من حذف هذا البند؟')) return;

    const newData = [...data];
    const site = { ...newData[siteIndex] };

    site.rows.splice(rowIndex, 1);
    site.rows = calculateSiteTotals(site.rows);

    newData[siteIndex] = site;
    onDataChange(newData);
  };

  // --- Attachment Handlers ---

  const triggerFileUpload = (siteIndex: number, rowIndex: number) => {
    setActiveUploadRow({ siteIndex, rowIndex });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadRow) return;

    if (file.size > 2 * 1024 * 1024) {
      safeAlert('حجم الملف كبير. الرجاء اختيار ملف أصغر من 2 ميجابايت لضمان حفظ البيانات.');
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
        data: base64Data,
      };

      row.attachments = [newAttachment];

      site.rows[activeUploadRow.rowIndex] = row;
      newData[activeUploadRow.siteIndex] = site;

      onDataChange(newData);
      setActiveUploadRow(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = (siteIndex: number, rowIndex: number, _attachmentId: string) => {
    if (!safeConfirm('هل أنت متأكد من حذف هذا المرفق؟')) return;

    const newData = [...data];
    const site = { ...newData[siteIndex] };
    const row = { ...site.rows[rowIndex] };

    row.attachments = [];
    site.rows[rowIndex] = row;
    newData[siteIndex] = site;
    onDataChange(newData);
  };

  const getFileIcon = (fileName: string, mimeType: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) {
      return <ImageIcon size={16} className="text-purple-600" strokeWidth={2} />;
    }
    if (ext === 'pdf') return <FileText size={16} className="text-red-600" strokeWidth={2} />;
    if (['doc', 'docx'].includes(ext)) return <FileText size={16} className="text-blue-600" strokeWidth={2} />;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet size={16} className="text-emerald-600" strokeWidth={2} />;
    if (['ppt', 'pptx'].includes(ext)) return <File size={16} className="text-orange-500" strokeWidth={2} />;
    if (ext === 'txt') return <FileText size={16} className="text-gray-500" strokeWidth={2} />;
    return <File size={16} className="text-slate-400" strokeWidth={2} />;
  };

  const getRowCategoryIcon = (row: ConsumptionRow) => {
    if (row.type === RowType.CALCULATED_TOTAL) {
      return <BarChart3 size={16} className="text-[#0284c7] shrink-0" strokeWidth={2.3} />;
    }
    if (row.isCost || row.label.includes('قيمة')) {
      return <Coins size={16} className="text-[#eab308] shrink-0" strokeWidth={2.2} />;
    }
    if (row.label.includes('الماء') || row.label.includes('المياه')) {
      return <Droplet size={16} className="text-[#0284c7] fill-[#bae6fd] shrink-0" strokeWidth={2.2} />;
    }
    if (row.label.includes('الكهرباء')) {
      return <Zap size={16} className="text-[#f59e0b] fill-[#fde047] shrink-0" strokeWidth={2.2} />;
    }
    if (row.label.includes('التكييف') || row.label.includes('BTU')) {
      return <Snowflake size={16} className="text-[#0284c7] shrink-0" strokeWidth={2.2} />;
    }
    return <Activity size={15} className="text-slate-400 shrink-0" />;
  };

  const handleAddSite = () => {
    const timestamp = Date.now();
    const createEmptyMonthValues = () => {
      const v: Record<string, number> = {};
      MONTHS.forEach((m) => (v[m.key] = 0));
      return v as Record<MonthKey, number>;
    };

    const newSite: SiteData = {
      id: `site_${timestamp}`,
      name: 'موقع جديد',
      meterNumber: '',
      startYear: year,
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
    onAddSite(newSite);
  };

  const handleDeleteSite = (siteIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (safeConfirm('هل أنت متأكد من رغبتك في حذف هذا الموقع وكافة بياناته؟')) {
      onArchiveSite(data[siteIndex].id);
    }
  };

  const handleRestore = (siteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (safeConfirm('هل أنت متأكد من رغبتك في استعادة هذا الموقع؟')) {
      onRestoreSite(siteId);
    }
  };

  const handlePermanentDeleteClick = (siteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (safeConfirm('تحذير: هل أنت متأكد من حذف هذا السجل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
      onDeletePermanently(siteId);
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

        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          const siteName = row[0];
          const meterNumber = row[1];
          const label = row[2];

          if (siteName) {
            if (currentSite) importedSites.push(currentSite);
            const timestamp = Date.now() + i;
            currentSite = {
              id: `site_imp_${timestamp}`,
              name: String(siteName),
              meterNumber: meterNumber ? String(meterNumber) : '',
              startYear: year,
              rows: [],
            };
          }

          if (!currentSite && !siteName) continue;

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
              attachments: [],
            };
            if (isTotal) newRow.isCost = false;
            currentSite.rows.push(newRow);
          }
        }

        if (currentSite) importedSites.push(currentSite);

        if (importedSites.length > 0) {
          if (safeConfirm(`تم العثور على ${importedSites.length} موقع. استبدال البيانات؟`)) {
            onDataChange(importedSites);
          }
        } else {
          safeAlert('لم يتم العثور على بيانات صالحة.');
        }
      } catch (error) {
        console.error('Import Error:', error);
        safeAlert('حدث خطأ أثناء قراءة الملف.');
      } finally {
        if (importInputRef.current) importInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const calculateHorizontalTotal = (values: Record<MonthKey, number>): number => {
    const sum = Object.values(values).reduce((sum, current) => sum + current, 0);
    return safeFloat(sum);
  };

  const formatNumber = (num: number) => {
    if (Math.abs(num) < 0.005) return '0';
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  const grandTotals = useMemo(() => {
    const totals: Record<MonthKey, number> = {
      jan: 0,
      feb: 0,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
      aug: 0,
      sep: 0,
      oct: 0,
      nov: 0,
      dec: 0,
    };

    data.forEach((site) => {
      const totalRow = site.rows.find((r) => r.type === RowType.CALCULATED_TOTAL);
      if (totalRow) {
        MONTHS.forEach((month) => {
          totals[month.key] = safeFloat(totals[month.key] + totalRow.values[month.key]);
        });
      } else {
        site.rows
          .filter((r) => r.isCost)
          .forEach((row) => {
            MONTHS.forEach((month) => {
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
      const headers = [
        'الموقع',
        'رقم العداد',
        'نوع الاستهلاك',
        ...MONTHS.map((m) => m.label),
        'المجموع',
        'المرفقات',
      ];
      const body: any[][] = [];

      data.forEach((site) => {
        site.rows.forEach((row, index) => {
          const rowTotal = calculateHorizontalTotal(row.values);
          const attachmentsList = row.attachments?.map((a) => a.name).join(', ') || '';
          body.push([
            index === 0 ? site.name : '',
            index === 0 ? site.meterNumber : '',
            row.label,
            ...MONTHS.map((m) => row.values[m.key]),
            rowTotal,
            attachmentsList,
          ]);
        });
        body.push([]);
      });

      body.push([
        'الإجمالي الكلي (درهم)',
        '',
        '',
        ...MONTHS.map((m) => grandTotals[m.key]),
        grandTotalHorizontal,
        '',
      ]);

      const wb = utils.book_new();
      const ws = utils.aoa_to_sheet([headers, ...body]);

      const merges = [];
      let currentRow = 1;

      data.forEach((site) => {
        const rowCount = site.rows.length;
        if (rowCount > 0) {
          merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow + rowCount - 1, c: 0 } });
          merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow + rowCount - 1, c: 1 } });
          currentRow += rowCount + 1;
        }
      });
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 2 } });

      ws['!merges'] = merges;
      ws['!cols'] = [
        { wch: 30 },
        { wch: 25 },
        { wch: 25 },
        ...MONTHS.map(() => ({ wch: 12 })),
        { wch: 18 },
        { wch: 25 },
      ];

      utils.book_append_sheet(wb, ws, `استهلاك ${year}`);
      writeFile(wb, `Saher_Consumption_${year}.xlsx`);
    } catch (e) {
      console.error('Export Error:', e);
      safeAlert('حدث خطأ أثناء تصدير الملف.');
    }
  };

  const handleSaveClick = () => {
    onSave();
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const renderRows = (
    sites: SiteData[],
    isArchive: boolean,
    handleAction: (index: number, id: string, e: React.MouseEvent) => void
  ) => {
    return sites.map((site, siteIndex) => (
      <React.Fragment key={site.id}>
        {siteIndex > 0 && (
          <>
            {/* Visual Spacer Between Site Blocks */}
            <tr className="h-3.5 bg-[#f8fafc] border-none print:hidden">
              <td colSpan={17} className="p-0 border-none bg-[#f8fafc]" />
            </tr>
            {/* Repeated Dark Navy Header Row per Site Block */}
            <tr
              className={`${
                isArchive ? 'bg-red-800 border-red-900' : 'bg-[#0b192c] border-slate-700'
              } text-white font-bold text-xs sm:text-sm border-y`}
            >
              <td
                className={`p-2.5 border-l ${
                  isArchive ? 'border-red-700' : 'border-slate-700/80'
                } align-middle`}
              >
                <div className="flex items-center justify-center h-full w-full text-center gap-1.5">
                  <MapPin size={15} className="text-sky-300" />
                  <span>الموقع</span>
                </div>
              </td>
              <td
                className={`p-2.5 border-l ${
                  isArchive ? 'border-red-700' : 'border-slate-700/80'
                } align-middle`}
              >
                <div className="flex items-center justify-center h-full w-full text-center gap-1.5">
                  <Hash size={15} className="text-sky-300" />
                  <span>رقم العداد</span>
                </div>
              </td>
              <td
                className={`p-2.5 border-l ${
                  isArchive ? 'border-red-700' : 'border-slate-700/80'
                } align-middle`}
              >
                <div className="flex items-center justify-center h-full w-full text-center gap-1.5">
                  <span>نوع الاستهلاك</span>
                </div>
              </td>
              {MONTHS.map((month) => (
                <td
                  key={`header-${site.id}-${month.key}`}
                  className={`p-2 border-l ${
                    isArchive ? 'border-red-700' : 'border-slate-700/80 bg-[#162742]'
                  } align-middle`}
                >
                  <div className="flex items-center justify-center h-full w-full text-center">
                    {month.label}
                  </div>
                </td>
              ))}
              <td
                className={`p-2.5 border-l ${
                  isArchive ? 'border-red-700 bg-red-950' : 'border-slate-700/80 bg-[#091526]'
                } text-white align-middle`}
              >
                <div className="flex items-center justify-center h-full w-full text-center">
                  المجموع
                </div>
              </td>
              <td
                className={`p-2 ${
                  isArchive ? 'bg-red-950' : 'bg-[#091526]'
                } text-white w-[42px] align-middle`}
              >
                <div className="flex items-center justify-center h-full w-full text-center">
                  <FolderOpen size={15} className="text-slate-300" />
                </div>
              </td>
            </tr>
          </>
        )}

        {site.rows.map((row, rowIndex) => {
          const isFirstRow = rowIndex === 0;
          const isLastRow = rowIndex === site.rows.length - 1;
          const isTotalRow = row.type === RowType.CALCULATED_TOTAL;
          const rowTotal = calculateHorizontalTotal(row.values);
          const hasAttachment = row.attachments && row.attachments.length > 0;

          return (
            <tr
              key={row.id}
              className={`transition-colors ${
                isTotalRow
                  ? isArchive
                    ? 'bg-red-100 text-red-900 font-bold border-t border-red-200'
                    : 'bg-[#dbeafe] font-bold text-[#0f3460] border-t border-blue-200'
                  : 'bg-white hover:bg-sky-50/50 text-slate-700'
              } ${
                isLastRow
                  ? isArchive
                    ? 'border-b-2 border-red-800'
                    : 'border-b-2 border-slate-300'
                  : 'border-b border-slate-200'
              } ${isArchive && !isTotalRow ? 'bg-red-50/50 text-red-800' : ''}`}
            >
              {/* 1. الموقع (Merged across site rows) */}
              {isFirstRow && (
                <td
                  rowSpan={site.rows.length}
                  className={`${
                    isArchive ? 'bg-red-50 border-red-200' : 'bg-[#eff6ff] border-slate-200'
                  } font-extrabold border-l p-2 align-middle text-sm sm:text-base break-words relative group`}
                >
                  <div className="flex flex-col items-center justify-center h-full w-full relative">
                    <div className="flex items-center justify-center gap-1.5 mb-1 z-20 print:hidden w-full">
                      <button
                        type="button"
                        onClick={(e) => handleAction(siteIndex, site.id, e)}
                        className={`p-1.5 rounded-full shadow-xs border transition-all duration-150 cursor-pointer ${
                          isArchive
                            ? 'text-green-600 bg-white border-green-200 hover:bg-green-50'
                            : 'text-red-500 bg-white border-red-100 hover:bg-red-50 opacity-0 group-hover:opacity-100'
                        }`}
                        title={isArchive ? 'استعادة الموقع' : 'حذف الموقع'}
                      >
                        {isArchive ? <RotateCcw size={15} /> : <Trash2 size={15} />}
                      </button>
                      {isArchive && (
                        <button
                          type="button"
                          onClick={(e) => handlePermanentDeleteClick(site.id, e)}
                          className="p-1.5 rounded-full shadow-xs border transition-all duration-150 cursor-pointer text-red-600 bg-white border-red-200 hover:bg-red-100"
                          title="حذف نهائي"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                    <AutoResizeTextarea
                      disabled={isArchive}
                      value={site.name}
                      onChange={(e) => handleSiteNameChange(siteIndex, e.target.value)}
                      className={`w-full bg-transparent text-center border-none focus:ring-2 focus:ring-blue-500 focus:bg-white p-1.5 outline-none whitespace-normal break-words leading-snug rounded font-extrabold ${
                        isArchive ? 'cursor-not-allowed text-red-900' : 'text-[#0f3460]'
                      }`}
                      placeholder="اسم الموقع"
                      style={{ margin: '0 auto', minHeight: '48px' }}
                    />
                  </div>
                </td>
              )}

              {/* 2. رقم العداد (Merged across site rows) */}
              {isFirstRow && (
                <td
                  rowSpan={site.rows.length}
                  className={`${
                    isArchive ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
                  } font-mono tabular-nums text-xs sm:text-sm font-bold border-l p-2 align-middle break-words`}
                >
                  <div className="flex items-center justify-center h-full w-full">
                    <AutoResizeTextarea
                      disabled={isArchive}
                      value={site.meterNumber}
                      onChange={(e) => handleMeterNumberChange(siteIndex, e.target.value)}
                      className={`w-full bg-transparent text-center border-none focus:ring-2 focus:ring-blue-500 focus:bg-white p-1.5 outline-none font-mono tabular-nums whitespace-normal break-all leading-tight rounded ${
                        isArchive ? 'cursor-not-allowed text-red-700' : 'text-slate-800'
                      }`}
                      placeholder="رقم العداد"
                      style={{ margin: 'auto' }}
                    />
                  </div>
                </td>
              )}

              {/* 3. نوع الاستهلاك */}
              <td
                className={`px-2 py-1.5 border-l ${
                  isArchive ? 'border-red-200' : 'border-slate-200'
                } relative align-middle ${
                  row.isCost && !isArchive ? 'text-[#0f3460] font-bold' : ''
                } ${isArchive && row.isCost ? 'text-red-800 font-bold' : ''} group`}
              >
                <div className="flex items-center justify-between gap-1.5 w-full min-h-[36px] relative">
                  <div className="shrink-0">{getRowCategoryIcon(row)}</div>
                  <div className="flex flex-col items-center justify-center flex-1">
                    {row.unit && (
                      <span
                        className={`text-[10px] whitespace-nowrap mb-0.5 px-1 rounded ${
                          isArchive ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {row.unit}
                      </span>
                    )}
                    <AutoResizeTextarea
                      disabled={isArchive}
                      value={row.label}
                      onChange={(e) => handleRowLabelChange(siteIndex, rowIndex, e.target.value)}
                      className={`w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 focus:bg-blue-50 outline-none text-center text-xs sm:text-[13px] leading-tight whitespace-normal break-words ${
                        row.isCost || isTotalRow ? 'font-bold text-[#0f3460]' : 'font-semibold text-slate-700'
                      } ${isArchive ? 'cursor-not-allowed' : ''}`}
                      style={{ margin: 'auto' }}
                    />
                  </div>
                  {!isArchive && !isTotalRow && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAddRow(siteIndex, rowIndex)}
                        className="text-blue-500 hover:text-blue-700 p-0.5 cursor-pointer"
                        title="إضافة بند"
                      >
                        <PlusCircle size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(siteIndex, rowIndex)}
                        className="text-red-400 hover:text-red-600 p-0.5 cursor-pointer"
                        title="حذف البند"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </td>

              {/* 4. Months (يناير - ديسمبر) */}
              {MONTHS.map((month) => (
                <td
                  key={`${row.id}-${month.key}`}
                  className={`border-l ${
                    isArchive ? 'border-red-100' : isTotalRow ? 'border-blue-200' : 'border-slate-200'
                  } p-0 relative align-middle min-h-[2.5rem] h-auto ${
                    isTotalRow ? (isArchive ? 'bg-red-100' : 'bg-[#dbeafe]') : ''
                  }`}
                >
                  {isTotalRow || isArchive ? (
                    <div
                      className={`w-full min-h-full flex items-center justify-center bg-transparent text-center font-mono tabular-nums text-xs sm:text-[13px] font-bold break-all px-1 py-2.5 ${
                        isArchive ? 'text-red-900' : 'text-[#0f3460]'
                      }`}
                    >
                      {formatNumber(row.values[month.key])}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.values[month.key] === 0 ? '' : row.values[month.key]}
                      onChange={(e) => handleInputChange(siteIndex, rowIndex, month.key, e.target.value)}
                      className="w-full h-full min-h-[2.5rem] text-center bg-transparent focus:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all placeholder-slate-500 font-mono tabular-nums text-xs sm:text-[13px] flex items-center justify-center text-slate-800 font-semibold p-1"
                      placeholder="0"
                    />
                  )}
                </td>
              ))}

              {/* 5. المجموع */}
              <td
                className={`border-l ${
                  isArchive ? 'border-red-200' : 'border-slate-200'
                } font-bold font-mono tabular-nums align-middle px-1 break-all text-xs sm:text-[13px] ${
                  isArchive
                    ? 'bg-red-100 text-red-900'
                    : isTotalRow
                    ? 'bg-[#dbeafe] text-[#0f172a] font-black'
                    : 'bg-[#fefce8] text-slate-900'
                }`}
              >
                <div className="flex items-center justify-center w-full h-full">
                  {formatNumber(rowTotal)}
                </div>
              </td>

              {/* 6. المرفقات */}
              <td className="align-middle px-1 w-[42px] bg-slate-50/60">
                <div className="flex items-center justify-center w-full h-full p-1 min-h-[36px]">
                  {hasAttachment ? (
                    <div
                      className="relative group flex items-center justify-center"
                      title={row.attachments![0].name}
                    >
                      <a
                        href={row.attachments![0].data}
                        download={row.attachments![0].name}
                        className="block p-1 bg-white rounded border border-slate-200 hover:border-blue-400 shadow-xs transition-all"
                      >
                        {getFileIcon(row.attachments![0].name, row.attachments![0].type)}
                      </a>
                      {!isArchive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteAttachment(siteIndex, rowIndex, row.attachments![0].id);
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-[2px] shadow-xs hover:bg-red-600 transition-colors z-10 opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="حذف المرفق"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ) : (
                    !isArchive && (
                      <button
                        type="button"
                        onClick={() => triggerFileUpload(siteIndex, rowIndex)}
                        className="text-slate-400 hover:text-[#0284c7] transition-colors p-1 flex items-center justify-center cursor-pointer"
                        title="إرفاق ملف"
                      >
                        <Paperclip size={15} />
                      </button>
                    )
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
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
      />
      <input
        type="file"
        ref={importInputRef}
        onChange={handleImportFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />

      {/* Unified Action & Section Title Row (Exact Match to Master Reference) */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Right Action Buttons (RTL Start): حفظ التغييرات + سجل الأرشيف */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden shrink-0">
          <button
            type="button"
            onClick={handleSaveClick}
            className="flex items-center gap-2 bg-[#0b192c] hover:bg-[#162a47] text-white px-4 h-11 rounded-xl shadow-sm transition-all text-xs sm:text-sm font-bold border border-slate-700 cursor-pointer whitespace-nowrap"
          >
            {saveStatus === 'saved' ? (
              <Check size={17} className="text-emerald-400" />
            ) : (
              <Save size={17} className="text-[#eab308]" />
            )}
            <span>حفظ التغييرات</span>
          </button>

          <button
            type="button"
            onClick={() => setShowArchive(!showArchive)}
            className="flex items-center gap-2 bg-[#1e293b] hover:bg-[#334155] text-white px-4 h-11 rounded-xl shadow-sm transition-all text-xs sm:text-sm font-bold border border-slate-600 cursor-pointer whitespace-nowrap"
          >
            <Archive size={17} className="text-slate-200" />
            <span>سجل الأرشيف</span>
            {archivedData.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full">
                {archivedData.length}
              </span>
            )}
          </button>
        </div>

        {/* Center Dark Navy Title Banner */}
        <div className="flex-1 bg-[#0b192c] px-5 py-2.5 min-h-[46px] rounded-xl border-b-[3px] border-[#eab308] shadow-md flex items-center justify-center text-center">
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-wide">
            نسبة استهلاك الماء والكهرباء لمقرات ساهر - لسنة{' '}
            <span className="text-[#eab308] font-mono tabular-nums">{year}</span>
          </h2>
        </div>

        {/* Left Action Buttons (RTL End): استيراد + تصدير + طباعة */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden shrink-0">
          <button
            type="button"
            onClick={handleImportClick}
            className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-4 h-11 rounded-xl transition-all border border-blue-500/40 flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm cursor-pointer whitespace-nowrap"
            title="استيراد من Excel"
          >
            <Upload size={16} />
            <span>استيراد</span>
          </button>

          <button
            type="button"
            onClick={handleExportClick}
            className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-4 h-11 rounded-xl transition-all border border-blue-500/40 flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm cursor-pointer whitespace-nowrap"
            title="تصدير الى Excel"
          >
            <Download size={16} />
            <span>تصدير</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="bg-[#0f2942] hover:bg-[#163a5f] text-white px-4 h-11 rounded-xl transition-all border border-slate-700 flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm cursor-pointer whitespace-nowrap"
            title="طباعة"
          >
            <Printer size={16} />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* Main Consumption Data Table */}
      <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-sm bg-white print:shadow-none print:border-none">
        <table className="w-full text-sm text-center border-collapse min-w-[1220px] table-fixed">
          <thead>
            <tr className="bg-[#0b192c] text-white font-bold text-xs sm:text-sm border-b border-slate-700">
              <th className="p-2.5 border-l border-slate-700/80 w-[170px] align-middle">
                <div className="flex items-center justify-center h-full w-full text-center gap-1.5">
                  <MapPin size={15} className="text-sky-300" />
                  <span>الموقع</span>
                </div>
              </th>
              <th className="p-2.5 border-l border-slate-700/80 w-[130px] align-middle">
                <div className="flex items-center justify-center h-full w-full text-center gap-1.5">
                  <Hash size={15} className="text-sky-300" />
                  <span>رقم العداد</span>
                </div>
              </th>
              <th className="p-2.5 border-l border-slate-700/80 w-[185px] align-middle">
                <div className="flex items-center justify-center h-full w-full text-center gap-1.5">
                  <span>نوع الاستهلاك</span>
                </div>
              </th>
              {MONTHS.map((month) => (
                <th
                  key={month.key}
                  className="p-2 border-l border-slate-700/80 bg-[#162742] align-middle"
                >
                  <div className="flex items-center justify-center h-full w-full text-center">
                    {month.label}
                  </div>
                </th>
              ))}
              <th className="p-2.5 border-l border-slate-700/80 bg-[#091526] text-white w-[88px] align-middle">
                <div className="flex items-center justify-center h-full w-full text-center">
                  المجموع
                </div>
              </th>
              <th className="p-2 bg-[#091526] text-white w-[42px] align-middle">
                <div className="flex items-center justify-center h-full w-full text-center">
                  <FolderOpen size={15} className="text-slate-300" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>{renderRows(data, false, (idx, _id, e) => handleDeleteSite(idx, e))}</tbody>
        </table>
      </div>

      {/* Add New Site Button (Right-aligned in RTL) */}
      <div className="flex justify-start pt-1 print:hidden">
        <button
          type="button"
          onClick={handleAddSite}
          className="flex items-center gap-2 bg-[#0b192c] hover:bg-[#162a47] text-white px-5 py-2.5 rounded-xl shadow-sm transition-all text-xs sm:text-sm font-bold border border-slate-700 cursor-pointer"
        >
          <Plus size={17} />
          <span>إضافة موقع جديد</span>
        </button>
      </div>

      {/* Grand Total Bar (الإجمالي الكلي) */}
      <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-sm bg-white print:shadow-none print:border-none">
        <table className="w-full text-sm text-center border-collapse min-w-[1220px] table-fixed">
          <colgroup>
            <col className="w-[170px]" />
            <col className="w-[130px]" />
            <col className="w-[185px]" />
            {MONTHS.map((m) => (
              <col key={m.key} />
            ))}
            <col className="w-[88px]" />
            <col className="w-[42px]" />
          </colgroup>
          <tbody>
            <tr className="bg-[#dbeafe] text-[#0f172a] font-bold text-xs sm:text-sm">
              <td
                colSpan={3}
                className="p-3 text-center border-l border-slate-700 align-middle bg-[#0b192c] text-white"
              >
                <div className="flex items-center justify-center gap-2.5 w-full h-full font-extrabold text-sm sm:text-base">
                  <Coins size={18} className="text-[#eab308]" />
                  <span>الإجمالي الكلي (درهم)</span>
                </div>
              </td>
              {MONTHS.map((month) => (
                <td
                  key={`grand-${month.key}`}
                  className="p-2.5 border-l border-blue-300 text-center bg-[#dbeafe] align-middle font-mono tabular-nums break-all text-xs sm:text-sm font-bold"
                >
                  <div className="flex items-center justify-center w-full h-full">
                    {formatNumber(grandTotals[month.key])}
                  </div>
                </td>
              ))}
              <td className="p-2.5 bg-[#eab308] text-[#091526] text-center border-l border-yellow-600 align-middle font-mono tabular-nums break-all text-sm sm:text-base shadow-inner">
                <div className="flex items-center justify-center w-full h-full font-black">
                  {formatNumber(grandTotalHorizontal)}
                </div>
              </td>
              <td className="p-2 bg-[#dbeafe]" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Archive Section (Preserved) */}
      {showArchive && (
        <div
          ref={archiveRef}
          className="mt-8 pt-6 border-t-4 border-red-300 print:hidden animate-in fade-in duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-red-800">
              <Archive size={22} />
              <h3 className="text-lg font-bold">سجل الأرشيف (المواقع المحذوفة)</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowArchive(false)}
              className="text-red-600 underline text-sm hover:text-red-800 cursor-pointer"
            >
              إغلاق السجل
            </button>
          </div>
          {archivedData.length === 0 ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center text-red-800 text-sm">
              لا يوجد مواقع في الأرشيف حالياً.
            </div>
          ) : (
            <div className="overflow-x-auto border border-red-200 rounded-xl shadow-xs bg-white">
              <table className="w-full text-sm text-center border-collapse min-w-[1220px] table-fixed">
                <thead>
                  <tr className="bg-red-800 text-white font-bold border-b border-red-900 text-xs sm:text-sm">
                    <th className="p-2.5 border-l border-red-700 w-[170px] align-middle">
                      <div className="flex items-center justify-center h-full w-full text-center gap-1.5">
                        <MapPin size={15} className="text-white" />
                        <span>الموقع</span>
                      </div>
                    </th>
                    <th className="p-2.5 border-l border-red-700 w-[130px] align-middle">
                      <div className="flex items-center justify-center h-full w-full text-center gap-1.5">
                        <Hash size={15} className="text-white" />
                        <span>رقم العداد</span>
                      </div>
                    </th>
                    <th className="p-2.5 border-l border-red-700 w-[185px] align-middle">
                      <div className="flex items-center justify-center h-full w-full text-center gap-1.5">
                        <Activity size={15} className="text-white" />
                        <span>نوع الاستهلاك</span>
                      </div>
                    </th>
                    {MONTHS.map((month) => (
                      <th key={month.key} className="p-2 border-l border-red-700 align-middle">
                        {month.label}
                      </th>
                    ))}
                    <th className="p-2.5 border-l border-red-700 bg-red-950 text-white w-[88px] align-middle">
                      المجموع
                    </th>
                    <th className="p-2 bg-red-950 text-white w-[42px] align-middle">
                      <div className="flex items-center justify-center w-full">
                        <FolderOpen size={15} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {renderRows(archivedData, true, (_idx, id, e) => handleRestore(id, e))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Footnote Instructions */}
      <div className="flex justify-center lg:justify-end pt-1">
        <div className="text-xs text-slate-600 leading-relaxed text-right">
          * يتم حساب المجاميع أفقياً وعمودياً بشكل تلقائي.
          <br />
          * يمكن تعديل أسماء المواقع، أرقام العدادات، ومسميات الاستهلاك بالضغط عليها مباشرة.
          <br />
          * لإرفاق ملف، اضغط على أيقونة المشبك. يتم حفظ الملفات محلياً (الحجم الأقصى 2MB).
        </div>
      </div>
    </div>
  );
};

export default ConsumptionTable;