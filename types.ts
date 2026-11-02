
export type MonthKey = 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';

export const MONTHS: { key: MonthKey; label: string }[] = [
  { key: 'jan', label: 'يناير' },
  { key: 'feb', label: 'فبراير' },
  { key: 'mar', label: 'مارس' },
  { key: 'apr', label: 'أبريل' },
  { key: 'may', label: 'مايو' },
  { key: 'jun', label: 'يونيو' },
  { key: 'jul', label: 'يوليو' },
  { key: 'aug', label: 'أغسطس' },
  { key: 'sep', label: 'سبتمبر' },
  { key: 'oct', label: 'أكتوبر' },
  { key: 'nov', label: 'نوفمبر' },
  { key: 'dec', label: 'ديسمبر' },
];

export enum RowType {
  INPUT = 'INPUT',
  CALCULATED_TOTAL = 'CALCULATED_TOTAL' // For the "Total Value" row which sums costs
}

export interface Attachment {
  id: string;
  name: string;
  type: string; // MIME type
  data: string; // Base64 string for local storage/preview
}

export interface ConsumptionRow {
  id: string;
  label: string;
  type: RowType;
  unit?: string;
  isCost: boolean; // If true, this row contributes to the 'Total Value' sum
  values: Record<MonthKey, number>;
  attachments?: Attachment[];
}

export interface SiteData {
  id: string;
  name: string;
  meterNumber: string;
  rows: ConsumptionRow[];
  startYear?: number; // The year this site was added to the system
}

export interface YearData {
  year: number;
  sites: SiteData[];
}

// --- Annual Consumption Comparison Types ---

export interface AnnualSite {
  id: string;
  name: string;
  code?: string;
  meterNumber?: string;
  status: 'active' | 'inactive';
  archived?: boolean;
  order?: number;
  createdAt: string;
}

export interface AnnualConsumptionRecord {
  water: number | null; // null if unentered
  electricity: number | null; // null if unentered
  monthlyWater?: Partial<Record<MonthKey, number | null>>;
  monthlyElectricity?: Partial<Record<MonthKey, number | null>>;
  useMonthlyWaterSum?: boolean;
  useMonthlyElectricitySum?: boolean;
  notes?: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface AnnualComparisonTotals {
  waterBase: number;
  waterCurrent: number;
  waterDiff: number;
  waterPercent: number | null;
  electricityBase: number;
  electricityCurrent: number;
  electricityDiff: number;
  electricityPercent: number | null;
}
