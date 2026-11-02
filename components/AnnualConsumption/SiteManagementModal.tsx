import React, { useState } from 'react';
import { AnnualSite } from '../../types.ts';
import { X, Plus, Edit2, Trash2, Archive, RotateCcw, Check, Building2, Search, AlertCircle } from 'lucide-react';

interface SiteManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: AnnualSite[];
  onAddSite: (site: Omit<AnnualSite, 'id' | 'createdAt'>) => void;
  onUpdateSite: (id: string, updates: Partial<AnnualSite>) => void;
  onArchiveSite: (id: string) => void;
  onRestoreSite: (id: string) => void;
  onDeleteSitePermanently: (id: string) => void;
}

export const SiteManagementModal: React.FC<SiteManagementModalProps> = ({
  isOpen,
  onClose,
  sites,
  onAddSite,
  onUpdateSite,
  onArchiveSite,
  onRestoreSite,
  onDeleteSitePermanently,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);

  // New site form state
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newMeterNumber, setNewMeterNumber] = useState('');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editMeterNumber, setEditMeterNumber] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');

  if (!isOpen) return null;

  const handleStartEdit = (site: AnnualSite) => {
    setEditingSiteId(site.id);
    setEditName(site.name);
    setEditCode(site.code || '');
    setEditMeterNumber(site.meterNumber || '');
    setEditStatus(site.status);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateSite(id, {
      name: editName.trim(),
      code: editCode.trim() || undefined,
      meterNumber: editMeterNumber.trim() || undefined,
      status: editStatus,
    });
    setEditingSiteId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddSite({
      name: newName.trim(),
      code: newCode.trim() || undefined,
      meterNumber: newMeterNumber.trim() || undefined,
      status: newStatus,
      archived: false,
    });

    setNewName('');
    setNewCode('');
    setNewMeterNumber('');
    setNewStatus('active');
  };

  const filteredSites = sites.filter((s) => {
    const matchesArchive = showArchived ? s.archived : !s.archived;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.meterNumber && s.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesArchive && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#091526] text-white px-6 py-4 flex items-center justify-between border-b-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 rounded-xl text-yellow-400 border border-blue-400/30">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">إدارة المقرات والمنشآت</h2>
              <p className="text-xs text-blue-200">إضافة وتعديل وحفظ مقرات شركة ساهر مع الحفاظ على البيانات التاريخية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Add New Site Card */}
          <form
            onSubmit={handleCreateSubmit}
            className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Plus size={16} className="text-blue-600" />
                إضافة مقر جديد للنظام
              </h3>
              <span className="text-xs text-slate-500">يظهر المقر الجديد فوراً في جدول الاستهلاك السنوي</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المقر *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: ساعد – الفيلا (الدوريات)"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رمز المقر (اختياري)</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="مثال: SD-V01"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رقم العداد (اختياري)</label>
                <input
                  type="text"
                  value={newMeterNumber}
                  onChange={(e) => setNewMeterNumber(e.target.value)}
                  placeholder="مثال: 3934453626"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">حالة المقر</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="active">نشط (فعّال)</option>
                  <option value="inactive">غير نشط (متوقف مؤقتاً)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus size={16} />
                حفظ وإضافة المقر
              </button>
            </div>
          </form>

          {/* Search & Tabs for Active / Archived */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowArchived(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !showArchived
                    ? 'bg-[#091526] text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                المقرات النشطة ({sites.filter((s) => !s.archived).length})
              </button>
              <button
                type="button"
                onClick={() => setShowArchived(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  showArchived
                    ? 'bg-red-800 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                أرشيف المقرات ({sites.filter((s) => s.archived).length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في المقرات..."
                className="w-full pl-3 pr-9 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Sites Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">اسم المقر</th>
                  <th className="p-3">الرمز</th>
                  <th className="p-3">رقم العداد</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSites.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      لا توجد مقرات مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredSites.map((site) => {
                    const isEditing = editingSiteId === site.id;

                    if (isEditing) {
                      return (
                        <tr key={site.id} className="bg-blue-50/80">
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full p-1.5 text-xs border border-blue-400 rounded bg-white"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={editCode}
                              onChange={(e) => setEditCode(e.target.value)}
                              className="w-full p-1.5 text-xs border border-blue-400 rounded bg-white"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={editMeterNumber}
                              onChange={(e) => setEditMeterNumber(e.target.value)}
                              className="w-full p-1.5 text-xs border border-blue-400 rounded bg-white font-mono"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                              className="p-1.5 text-xs border border-blue-400 rounded bg-white"
                            >
                              <option value="active">نشط</option>
                              <option value="inactive">غير نشط</option>
                            </select>
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(site.id)}
                                className="bg-emerald-600 text-white p-1.5 rounded hover:bg-emerald-700 transition"
                                title="حفظ التعديل"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSiteId(null)}
                                className="bg-slate-400 text-white p-1.5 rounded hover:bg-slate-500 transition"
                                title="إلغاء"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={site.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-800">{site.name}</td>
                        <td className="p-3 text-slate-500 font-mono">{site.code || '—'}</td>
                        <td className="p-3 text-slate-500 font-mono">{site.meterNumber || '—'}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              site.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {site.status === 'active' ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!site.archived ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(site)}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition"
                                  title="تعديل بيانات المقر"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`هل أنت متأكد من أرشفة مقر "${site.name}"؟ ستبقى البيانات التاريخية محفوظة.`)) {
                                      onArchiveSite(site.id);
                                    }
                                  }}
                                  className="text-amber-600 hover:text-amber-800 p-1 rounded hover:bg-amber-50 transition"
                                  title="أرشفة المقر (حفظ السجلات)"
                                >
                                  <Archive size={15} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onRestoreSite(site.id)}
                                  className="text-emerald-600 hover:text-emerald-800 p-1 rounded hover:bg-emerald-50 transition"
                                  title="استعادة من الأرشيف"
                                >
                                  <RotateCcw size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`تحذير: هل أنت متأكد من حذف مقر "${site.name}" نهائياً من قاعدة البيانات؟ لا يمكن التراجع.`)) {
                                      onDeleteSitePermanently(site.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition"
                                  title="حذف نهائي"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3 text-xs text-amber-900">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>ضمان سلامة السجلات:</strong> تعديل اسم المقر يحدث تلقائياً في كافة الجداول السنوية والشهرية مع بقاء
              كافة سجلات استهلاك المياه والكهرباء التاريخية كما هي دون فقدان.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-5 py-2 rounded-lg transition"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
