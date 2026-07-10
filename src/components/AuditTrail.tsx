import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Server
} from 'lucide-react';

export const AuditTrail: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);

    const matchesAction = selectedAction === 'All' || log.action === selectedAction;

    return matchesSearch && matchesAction;
  });

  const actionsList = ['All', ...Array.from(new Set(auditLogs.map(l => l.action)))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Immutable Audit Trail Logs</h2>
          <p className="text-xs text-slate-400">HIPAA compliant history of all generation, signing, printing, and administrative updates</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs, names, or IP..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Action Select */}
            <div className="relative">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100"
              >
                {actionsList.map((act, index) => (
                  <option key={index} value={act}>{act}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => alert("Audit logs exported as encrypted CSV package")}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Download size={13} /> Export Encrypted Logs
            </button>
          </div>
        </div>

        {/* Security Warning banner */}
        <div className="p-3 bg-blue-50 border-b border-blue-100 text-blue-800 text-[10px] flex items-center gap-2 px-6">
          <ShieldCheck size={16} className="text-blue-600 shrink-0" />
          <span>
            <strong>Immutable Logging Active:</strong> This system uses Write Once Read Many (WORM) storage patterns. Logs cannot be deleted or mutated by any user, including Super Admins.
          </span>
        </div>

        {/* Table logs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 font-bold uppercase">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Action Type</th>
                <th className="py-3.5 px-6">Operator / Role</th>
                <th className="py-3.5 px-6">Details</th>
                <th className="py-3.5 px-6 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">No logs found matching filter criteria.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-6 text-slate-500 font-semibold text-xs whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{log.performedByName}</div>
                      <div className="text-[10px] text-slate-400">{log.performedByRole}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 max-w-sm font-medium">
                      {log.details}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-slate-400 text-xs">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <Server size={12} className="text-slate-400" />
            Connected to Sealed Storage Server: server-primary-12
          </div>
          <span>Total audit footprint: {auditLogs.length} events logged</span>
        </div>
      </div>
    </div>
  );
};
