import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Calendar, 
  Activity, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  UserPlus
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedPatientId: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, setSelectedPatientId }) => {
  const { currentHospital, patients, documents, auditLogs } = useApp();

  // Compute metrics
  const todayDateStr = '2026-07-09'; // Simulated today's date matching user metadata
  const todayPatients = patients.filter(p => p.admissionDate === todayDateStr || p.surgeryDate === todayDateStr);
  const activeAdmissions = patients.length;
  const todaySurgeries = patients.filter(p => p.surgeryDate === todayDateStr);
  const pendingConsents = documents.filter(d => d.status === 'Pending Signatures');
  const signedDocs = documents.filter(d => d.status === 'Signed' || d.status === 'Locked');
  const recentPatients = patients.slice(0, 5);

  const stats = [
    { 
      label: "Today's Patients", 
      value: todayPatients.length, 
      change: "+2 since morning", 
      icon: Users, 
      color: "text-blue-600 bg-blue-50 border-blue-100" 
    },
    { 
      label: "Active Admissions", 
      value: activeAdmissions, 
      change: "Bed occupancy 64%", 
      icon: Calendar, 
      color: "text-teal-600 bg-teal-50 border-teal-100" 
    },
    { 
      label: "Surgeries Scheduled", 
      value: todaySurgeries.length, 
      change: "2 in progress", 
      icon: Activity, 
      color: "text-rose-600 bg-rose-50 border-rose-100" 
    },
    { 
      label: "Pending Consents", 
      value: pendingConsents.length, 
      change: "Requires doctor signature", 
      icon: FileText, 
      color: "text-amber-600 bg-amber-50 border-amber-100" 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div 
        className="p-6 rounded-2xl text-white shadow-lg relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${currentHospital.colors.primary} 0%, ${currentHospital.colors.secondary} 100%)` 
        }}
      >
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-36 h-36 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute left-1/3 bottom-0 -mb-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {currentHospital.code} Tenant Console
          </span>
          <h1 className="text-3xl font-extrabold mt-3">{currentHospital.name}</h1>
          <p className="text-white/80 mt-1 max-w-xl text-sm leading-relaxed">
            Welcome to the AI clinical documentation portal. All documents generated conform to legal frameworks and are digitally hashed and timestamped.
          </p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between hover:shadow-md transition-all duration-300">
            <div className="space-y-1">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{stat.label}</span>
              <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
              <span className="text-slate-500 text-xs flex items-center gap-1 font-semibold">
                <TrendingUp size={12} className="text-green-500" />
                {stat.change}
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${stat.color}`}>
              <stat.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2/3 - Patient List & Doc Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Patients Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Recent Admissions & Surgeries</h3>
                <p className="text-xs text-slate-400">Click a patient to generate procedure packs or view details</p>
              </div>
              <button 
                onClick={() => setActiveTab('patients')}
                className="text-xs font-bold flex items-center gap-1 hover:underline"
                style={{ color: currentHospital.colors.primary }}
              >
                <UserPlus size={14} /> Register Patient
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-xs text-slate-400 font-semibold uppercase">
                    <th className="py-3 px-4">Patient Info</th>
                    <th className="py-3 px-4">Diagnosis & Case</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {recentPatients.map((p) => {
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{p.name}</div>
                          <div className="text-xs text-slate-400 flex gap-2">
                            <span>{p.gender}, {p.age} Yrs</span>
                            <span>•</span>
                            <span className="font-mono">{p.uhid}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-700 max-w-[200px] truncate font-medium">{p.diagnosis}</div>
                          <div className="text-xs text-slate-400">{p.procedurePlanned}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {p.emergency ? (
                            <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Emergency</span>
                          ) : (
                            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Planned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedPatientId(p.id);
                              setActiveTab('clinical');
                            }}
                            className="bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-all"
                          >
                            AI Gen <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Document Metrics & Completion */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4">MedDocs AI Clinical Activity Ratio</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl text-center space-y-1">
                <CheckCircle size={20} className="text-green-500 mx-auto" />
                <div className="text-2xl font-bold text-slate-800">{signedDocs.length}</div>
                <div className="text-xs text-slate-400">Signed & Archived</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-center space-y-1">
                <Clock size={20} className="text-amber-500 mx-auto" />
                <div className="text-2xl font-bold text-slate-800">{pendingConsents.length}</div>
                <div className="text-xs text-slate-400">Awaiting Signatures</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-center space-y-1">
                <AlertTriangle size={20} className="text-red-400 mx-auto" />
                <div className="text-2xl font-bold text-slate-800">{patients.filter(p => documents.filter(d => d.patientId === p.id).length === 0).length}</div>
                <div className="text-xs text-slate-400">No Documents Yet</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1/3 - Active Surgeon Timeline / Audit Trail */}
        <div className="space-y-6">
          {/* Operations scheduled today */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Today's Surgery Timeline</h3>
              <p className="text-xs text-slate-400">July 9, 2026 schedule</p>
            </div>
            <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-5 py-2">
              {todaySurgeries.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">No surgeries scheduled for today.</div>
              ) : (
                todaySurgeries.map((p) => (
                  <div key={p.id} className="relative group">
                    <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-50 group-hover:scale-110 transition-transform"></div>
                    <div className="text-xs text-slate-400 font-semibold flex justify-between">
                      <span>09:00 AM Onwards</span>
                      <span className="text-blue-600 font-bold">{p.ward}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mt-1">{p.name}</h4>
                    <p className="text-xs text-slate-500">{p.procedurePlanned}</p>
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">{p.asaGrade}</span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">BP: {p.vitals.bp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Hospital Audit Trail</h3>
              <button 
                onClick={() => setActiveTab('audit')}
                className="text-xs font-semibold hover:underline"
                style={{ color: currentHospital.colors.primary }}
              >
                View Logs
              </button>
            </div>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-50 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{log.action}</span>
                    <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{log.details}</p>
                  <div className="text-[9px] text-slate-400">
                    By {log.performedByName} ({log.performedByRole}) • IP: {log.ipAddress}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
