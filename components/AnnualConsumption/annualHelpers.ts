import { MonthKey, MONTHS, AnnualSite, AnnualConsumptionRecord, AuditLogEntry } from '../../types.ts';

export const ANNUAL_STORAGE_KEYS = {
  SITES: 'saher_annual_sites_directory_v1',
  RECORDS: 'saher_annual_consumption_records_v2',
  YEARS: 'saher_annual_configured_years_v1',
  AUDIT: 'saher_annual_audit_log_v1',
  SELECTED_BASE_YEAR: 'saher_annual_base_year_v1',
  SELECTED_CURRENT_YEAR: 'saher_annual_current_year_v1',
};

export const DEFAULT_ANNUAL_SITES: AnnualSite[] = [
  {
    id: 'site_saed_villa',
    name: 'ساعد – الفيلا (الدوريات)',
    code: 'SD-V01',
    meterNumber: '3934453626',
    status: 'active',
    archived: false,
    order: 1,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'site_saed_battuta',
    name: 'ساعد – ابن بطوطة مول',
    code: 'SD-B02',
    meterNumber: 't0012704',
    status: 'active',
    archived: false,
    order: 2,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'site_saed_ajman',
    name: 'ساعد – عجمان التلة',
    code: 'SD-A03',
    meterNumber: '221000514609',
    status: 'active',
    archived: false,
    order: 3,
    createdAt: '2025-01-01T00:00:00.000Z'
  }
];

export const DEFAULT_CONSUMPTION_RECORDS: Record<string, Record<number, AnnualConsumptionRecord>> = {
  'site_saed_villa': {
    2025: {
      water: 0,
      electricity: 0,
      notes: '',
      updatedAt: '2025-01-01T00:00:00.000Z'
    },
    2026: {
      water: 0,
      electricity: 0,
      notes: '',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  },
  'site_saed_battuta': {
    2025: {
      water: 0,
      electricity: 0,
      notes: '',
      updatedAt: '2025-01-01T00:00:00.000Z'
    },
    2026: {
      water: 0,
      electricity: 0,
      notes: '',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  },
  'site_saed_ajman': {
    2025: {
      water: 0,
      electricity: 0,
      notes: '',
      updatedAt: '2025-01-01T00:00:00.000Z'
    },
    2026: {
      water: 0,
      electricity: 0,
      notes: '',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  }
};

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log_init_1',
    timestamp: new Date().toISOString(),
    user: 'النظام (قسم إدارة المرافق)',
    action: 'تهيئة النظام',
    details: 'تهيئة جدول فرق الاستهلاك السنوي واعتماد المقرات الافتراضية لسنتي 2025 و 2026'
  }
];

// Number Formatter with Arabic Locale and Thousands Separators
export const formatNumber = (
  value: number | null | undefined,
  options: { decimals?: number; fallback?: string } = {}
): string => {
  const { decimals = 2, fallback = '—' } = options;
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  // If integer, don't show unnecessary trailing .00 unless requested
  const isInt = Number.isInteger(value);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isInt ? 0 : 0,
    maximumFractionDigits: decimals,
  }).format(value);
  return formatted;
};

// Safe float precision helper
export const roundTo = (num: number, decimals: number = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

// Calculation of difference and percentage
export interface DiffResult {
  diff: number | null;
  percent: number | null;
  status: 'increase' | 'decrease' | 'zero' | 'unavailable';
  percentText: string;
  diffText: string;
}

export const calculateDiff = (current: number | null | undefined, base: number | null | undefined): DiffResult => {
  if (current === null || current === undefined || base === null || base === undefined) {
    return {
      diff: null,
      percent: null,
      status: 'unavailable',
      percentText: 'غير متاحة',
      diffText: '—'
    };
  }

  const diff = roundTo(current - base);

  if (diff === 0) {
    return {
      diff: 0,
      percent: 0,
      status: 'zero',
      percentText: '0%',
      diffText: '0'
    };
  }

  if (base === 0) {
    return {
      diff,
      percent: null,
      status: diff > 0 ? 'increase' : 'decrease',
      percentText: 'غير متاحة',
      diffText: (diff > 0 ? '+' : '') + formatNumber(diff)
    };
  }

  const percent = roundTo(((current - base) / Math.abs(base)) * 100, 2);
  const status = diff > 0 ? 'increase' : 'decrease';
  const percentText = (percent > 0 ? '+' : '') + percent.toFixed(1) + '%';
  const diffText = (diff > 0 ? '+' : '') + formatNumber(diff);

  return {
    diff,
    percent,
    status,
    percentText,
    diffText
  };
};

export const getMonthlySum = (months?: Partial<Record<MonthKey, number | null>>): { total: number; count: number } => {
  if (!months) return { total: 0, count: 0 };
  let total = 0;
  let count = 0;
  MONTHS.forEach(m => {
    const val = months[m.key];
    if (typeof val === 'number' && !isNaN(val)) {
      total += val;
      count++;
    }
  });
  return { total: roundTo(total), count };
};
