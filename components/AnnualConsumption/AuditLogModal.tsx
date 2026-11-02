import React, { useState } from 'react';
import { AuditLogEntry } from '../../types.ts';
import { X, History, Search, ShieldCheck, Download, Trash2 } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
  onClearLogs?: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('ar-AE')} - ${d.toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#091526] text-white px-6 py-4 flex items-center justify-between border-b-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 rounded-xl text-yellow-400 border border-blue-400/30">
              <History size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">سجل العمليات والتدقيق (Audit Log)</h2>
              <p className="text-xs text-blue-200">
                توثيق كامل لكافة التعديلات والإضافات التي تمت على المقرات والاستهلاك السنوي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في سجل العمليات..."
              className="w-full pl-3 pr-9 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 font-medium">
              إجمالي السجلات: <strong>{logs.length}</strong>
            </span>
            {onClearLogs && logs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من تفريغ سجل التدقيق؟')) {
                    onClearLogs();
                  }
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-3 py-1.5 rounded-lg border border-red-200 transition flex items-center gap-1"
              >
                <Trash2 size={13} />
                تفريغ السجل
              </button>
            )}
          </div>
        </div>

        {/* Log List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              لا توجد عمليات مسجلة مطابقة للبحث
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 shadow-sm text-xs transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 shrink-0 mt-0.5">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-mono">
                        {log.user}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">{log.details}</p>
                  </div>
                </div>
                <div className="text-slate-400 text-[11px] font-mono shrink-0 pr-8 sm:pr-0">
                  {formatDate(log.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-5 py-2 rounded-lg transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
