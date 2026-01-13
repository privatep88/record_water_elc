import { SiteData, RowType, MonthKey, MONTHS } from './types.ts';

const createEmptyValues = (): Record<MonthKey, number> => {
  const values: any = {};
  MONTHS.forEach(m => values[m.key] = 0);
  return values;
};

export const INITIAL_SITES: SiteData[] = [
  {
    id: 'site_1',
    name: 'فيلا 2 محمد بن زايد',
    meterNumber: '3934453626',
    rows: [
      { id: 's1_r1', label: 'الماء ( متر مكعب)', unit: '', type: RowType.INPUT, isCost: false, values: createEmptyValues(), attachments: [] },
      { id: 's1_r2', label: 'قيمة الاستهلاك الماء', type: RowType.INPUT, isCost: true, values: createEmptyValues(), attachments: [] },
      { id: 's1_r3', label: 'الكهرباء ( كيلو واط )', unit: '', type: RowType.INPUT, isCost: false, values: createEmptyValues(), attachments: [] },
      { id: 's1_r4', label: 'قيمة الاستهلاك الكهرباء', type: RowType.INPUT, isCost: true, values: createEmptyValues(), attachments: [] },
      { id: 's1_total', label: 'إجمالي قيمة الاستهلاك', type: RowType.CALCULATED_TOTAL, isCost: false, values: createEmptyValues(), attachments: [] },
    ]
  },
  {
    id: 'site_2',
    name: 'مقر ابن بطوطة',
    meterNumber: 't0012704',
    rows: [
      { id: 's2_r1', label: 'الماء ( متر مكعب)', unit: '', type: RowType.INPUT, isCost: false, values: createEmptyValues(), attachments: [] },
      { id: 's2_r2', label: 'قيمة الاستهلاك الماء', type: RowType.INPUT, isCost: true, values: createEmptyValues(), attachments: [] },
      { id: 's2_r3', label: 'الكهرباء ( كيلو واط )', unit: '', type: RowType.INPUT, isCost: false, values: createEmptyValues(), attachments: [] },
      { id: 's2_r4', label: 'قيمة الاستهلاك الكهرباء', type: RowType.INPUT, isCost: true, values: createEmptyValues(), attachments: [] },
      { id: 's2_total', label: 'إجمالي قيمة الاستهلاك', type: RowType.CALCULATED_TOTAL, isCost: false, values: createEmptyValues(), attachments: [] },
    ]
  },
  {
    id: 'site_3',
    name: 'توجيه عجمان التلة',
    meterNumber: '221000514609',
    rows: [
      { id: 's3_r1', label: 'الماء ( جالون)', unit: '', type: RowType.INPUT, isCost: false, values: createEmptyValues(), attachments: [] },
      { id: 's3_r2', label: 'قيمة الاستهلاك الماء', type: RowType.INPUT, isCost: true, values: createEmptyValues(), attachments: [] },
      { id: 's3_r3', label: 'الكهرباء ( كيلو واط )', unit: '', type: RowType.INPUT, isCost: false, values: createEmptyValues(), attachments: [] },
      { id: 's3_r4', label: 'قيمة الاستهلاك الكهرباء', type: RowType.INPUT, isCost: true, values: createEmptyValues(), attachments: [] },
      { id: 's3_r5', label: 'استهلاك التكييف BTU', type: RowType.INPUT, isCost: false, values: createEmptyValues(), attachments: [] },
      { id: 's3_r6', label: 'قيمة استهلاك التكييف', type: RowType.INPUT, isCost: true, values: createEmptyValues(), attachments: [] },
      { id: 's3_total', label: 'إجمالي قيمة الاستهلاك', type: RowType.CALCULATED_TOTAL, isCost: false, values: createEmptyValues(), attachments: [] },
    ]
  }
];