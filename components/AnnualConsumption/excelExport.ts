import { utils, writeFile } from 'xlsx';
import { AnnualSite, AnnualConsumptionRecord } from '../../types.ts';
import { calculateDiff, formatNumber } from './annualHelpers.ts';

interface ExportParams {
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

export const exportAnnualConsumptionToExcel = ({
  baseYear,
  currentYear,
  sites,
  records,
  totals,
}: ExportParams) => {
  try {
    const wb = utils.book_new();

    const titleRow = [`فرق الاستهلاك السنوي لسنتي (${baseYear} - ${currentYear})`];
    const subtitleRow = ['إدارة الخدمات العامة – قسم إدارة المرافق | نظام تسجيل استهلاك الماء والكهرباء'];
    const dateRow = [`تاريخ استخراج التقرير: ${new Date().toLocaleDateString('ar-AE')}`];
    const emptyRow: any[] = [];

    const headers = [
      'المقر',
      `إجمالي استهلاك الماء (متر مكعب) ${baseYear}`,
      `إجمالي استهلاك الماء (متر مكعب) ${currentYear}`,
      `فرق استهلاك الماء (${currentYear} - ${baseYear})`,
      `إجمالي استهلاك الكهرباء (كيلو واط) ${baseYear}`,
      `إجمالي استهلاك الكهرباء (كيلو واط) ${currentYear}`,
      `فرق استهلاك الكهرباء (${currentYear} - ${baseYear})`,
      'الحالة',
    ];

    const dataRows = sites.map((site) => {
      const baseRec = records[site.id]?.[baseYear];
      const curRec = records[site.id]?.[currentYear];

      const wBase = baseRec?.water ?? null;
      const wCur = curRec?.water ?? null;
      const wDiff = calculateDiff(wCur, wBase);

      const eBase = baseRec?.electricity ?? null;
      const eCur = curRec?.electricity ?? null;
      const eDiff = calculateDiff(eCur, eBase);

      const wDiffCell = wDiff.diff !== null 
        ? `${wDiff.diff > 0 ? '+' : ''}${wDiff.diff} (${wDiff.percentText})`
        : '—';

      const eDiffCell = eDiff.diff !== null 
        ? `${eDiff.diff > 0 ? '+' : ''}${eDiff.diff} (${eDiff.percentText})`
        : '—';

      return [
        site.name,
        wBase !== null ? wBase : '—',
        wCur !== null ? wCur : '—',
        wDiffCell,
        eBase !== null ? eBase : '—',
        eCur !== null ? eCur : '—',
        eDiffCell,
        site.status === 'active' ? 'نشط' : 'غير نشط',
      ];
    });

    const wTotPercentText = totals.waterPercent !== null 
      ? ` (${totals.waterPercent > 0 ? '+' : ''}${totals.waterPercent.toFixed(1)}%)`
      : '';
    const eTotPercentText = totals.electricityPercent !== null 
      ? ` (${totals.electricityPercent > 0 ? '+' : ''}${totals.electricityPercent.toFixed(1)}%)`
      : '';

    const totalsRow = [
      'المجموع الكلي',
      totals.waterBase,
      totals.waterCurrent,
      `${totals.waterDiff > 0 ? '+' : ''}${totals.waterDiff}${wTotPercentText}`,
      totals.electricityBase,
      totals.electricityCurrent,
      `${totals.electricityDiff > 0 ? '+' : ''}${totals.electricityDiff}${eTotPercentText}`,
      '—',
    ];

    const footerRow1 = [''];
    const footerRow2 = ['إدارة الخدمات العامة – قسم إدارة المرافق – SAHER FOR SMART SERVICES'];

    const worksheetData = [
      titleRow,
      subtitleRow,
      dateRow,
      emptyRow,
      headers,
      ...dataRows,
      emptyRow,
      totalsRow,
      footerRow1,
      footerRow2,
    ];

    const ws = utils.aoa_to_sheet(worksheetData);

    // Merge title cells
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
      { s: { r: worksheetData.length - 1, c: 0 }, e: { r: worksheetData.length - 1, c: 7 } },
    ];

    // Column widths
    ws['!cols'] = [
      { wch: 30 }, // المقر
      { wch: 26 }, // ماء أساس
      { wch: 26 }, // ماء حالي
      { wch: 28 }, // فرق ماء
      { wch: 26 }, // كهرباء أساس
      { wch: 26 }, // كهرباء حالي
      { wch: 28 }, // فرق كهرباء
      { wch: 14 }, // الحالة
    ];

    utils.book_append_sheet(wb, ws, `فرق_الاستهلاك_${baseYear}_${currentYear}`);
    writeFile(wb, `فرق_الاستهلاك_السنوي_${baseYear}_${currentYear}.xlsx`);
    return true;
  } catch (error) {
    console.error('Failed to export annual consumption to Excel', error);
    return false;
  }
};
